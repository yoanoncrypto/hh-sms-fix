import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useUsers = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users at once for frontend filtering
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        phoneNumber: user.phone_number,
        email: user.email || undefined,
        name: user.name || undefined,
        country: user.country || 'Unknown',
        status: user.status,
        createdAt: new Date(user.created_at),
        lastContactedAt: user.last_contacted_at ? new Date(user.last_contacted_at) : undefined,
      }));

      setAllUsers(formattedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          phone_number: userData.phoneNumber,
          email: userData.email || null,
          name: userData.name || null,
          country: userData.country,
          status: userData.status,
          last_contacted_at: userData.lastContactedAt?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: data.id,
        phoneNumber: data.phone_number,
        email: data.email || undefined,
        name: data.name || undefined,
        country: data.country || 'Unknown',
        status: data.status,
        createdAt: new Date(data.created_at),
        lastContactedAt: data.last_contacted_at ? new Date(data.last_contacted_at) : undefined,
      };

      setAllUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    try {
      const updateData: any = {};
      
      if (userData.phoneNumber !== undefined) updateData.phone_number = userData.phoneNumber;
      if (userData.email !== undefined) updateData.email = userData.email || null;
      if (userData.name !== undefined) updateData.name = userData.name || null;
      if (userData.country !== undefined) updateData.country = userData.country;
      if (userData.status !== undefined) updateData.status = userData.status;
      if (userData.lastContactedAt !== undefined) updateData.last_contacted_at = userData.lastContactedAt?.toISOString() || null;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      const updatedUser: User = {
        id: data.id,
        phoneNumber: data.phone_number,
        email: data.email || undefined,
        name: data.name || undefined,
        country: data.country || 'Unknown',
        status: data.status,
        createdAt: new Date(data.created_at),
        lastContactedAt: data.last_contacted_at ? new Date(data.last_contacted_at) : undefined,
      };

      setAllUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      return updatedUser;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const bulkAddUsersWithData = async (userData: Array<{ phone: string; username?: string }>) => {
    const BATCH_SIZE = 500;
    try {
      const { normalizePhoneNumber, detectCountryFromPhone } = await import('../utils/phoneValidation');
      const results = {
        total: userData.length,
        successful: 0,
        failed: 0,
        created: 0,
        updated: 0,
        errors: [] as Array<{ phone: string; name?: string; error: string }>
      };
      
      // First, deduplicate the input data by phone number
      const uniqueUserData = new Map<string, { phone: string; username?: string }>();
      for (const user of userData) {
        const normalizedPhone = normalizePhoneNumber(user.phone);
        if (!uniqueUserData.has(normalizedPhone)) {
          uniqueUserData.set(normalizedPhone, user);
        }
      }
      const deduplicatedUserData = Array.from(uniqueUserData.values());
      results.total = deduplicatedUserData.length;
      
      // Filter out completely empty entries
      const filteredUserData = deduplicatedUserData.filter(user => 
        user.phone && user.phone.trim().length > 0
      );
      
      results.total = filteredUserData.length;
      
      for (let i = 0; i < filteredUserData.length; i += BATCH_SIZE) {
        const batch = filteredUserData.slice(i, i + BATCH_SIZE);
        const batchNormalizedPhones = batch.map(u => normalizePhoneNumber(u.phone));

        try {
          // 1. Check which users already exist in the database
          const { data: existingUsersInDb, error: selectError } = await supabase
            .from('users')
            .select('phone_number')
            .in('phone_number', batchNormalizedPhones);

          if (selectError) throw selectError;

          const existingPhoneNumbers = new Set(existingUsersInDb.map(u => u.phone_number));

          // 2. Skip existing users and prepare only new users for insertion
          const usersToInsert = batch.filter(user => {
            const normalizedPhone = normalizePhoneNumber(user.phone);
            if (existingPhoneNumbers.has(normalizedPhone)) {
              results.failed++;
              results.errors.push({
                phone: user.phone,
                name: user.username || '',
                error: 'Phone number already exists in database'
              });
              return false;
            }
            return true;
          }).map(user => {
            const normalizedPhone = normalizePhoneNumber(user.phone);
            return {
              phone_number: normalizedPhone,
              name: user.username || '',
              country: detectCountryFromPhone(normalizedPhone) || 'Unknown',
              status: 'active' as const,
            };
          });

          if (usersToInsert.length === 0) {
            // All users in this batch already existed, move to next batch
            continue;
          }

          // 3. Insert only new users
          const { data: insertedData, error: insertError } = await supabase
            .from('users')
            .insert(usersToInsert)
            .select('id, phone_number');

          if (insertError) throw insertError;

          // 4. Update counters
          results.created += insertedData.length;
          results.successful += insertedData.length;

        } catch (err) {
          // Handle batch-level errors
          batch.forEach(user => {
            results.failed++;
            results.errors.push({
              phone: user.phone,
              name: user.username || '',
              error: err instanceof Error ? err.message : 'Unknown error during batch processing'
            });
          });
        }
      }
      
      await fetchUsers(); // Refresh the list
      return results;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to bulk add users');
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    try {
      const BATCH_SIZE = 100; // Process deletions in batches to avoid URL length limits
      
      for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', batch);

        if (error) {
          let errorMessage = 'Failed to delete users';
          
          if (error.message?.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to database. Please check your internet connection and Supabase configuration.';
          } else if (error.message) {
            errorMessage = `Database error: ${error.message}`;
          }
          
          throw new Error(errorMessage);
        }
      }

      setAllUsers(prev => prev.filter(user => !userIds.includes(user.id)));
    } catch (err) {
      if (err instanceof Error) {
        throw err; // Re-throw the error with our enhanced message
      } else {
        throw new Error('Failed to delete users: Unknown error occurred');
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    allUsers,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    bulkAddUsersWithData,
    deleteUsers,
  };
};