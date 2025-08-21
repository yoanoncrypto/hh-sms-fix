import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      loading: "Loading...",
      error: "Error",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      create: "Create",
      update: "Update",
      search: "Search",
      clear: "Clear",
      copy: "Copy",
      copied: "Copied!",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      yes: "Yes",
      no: "No",
      add: "Add",
      remove: "Remove",

      // Login
      login: {
        subtitle: "Sign in to manage your communication platform",
        emailAddress: "Email Address",
        emailPlaceholder: "Enter your email",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        signIn: "Sign In",
        signingIn: "Signing in...",
        createNewAccount: "Create New Account",
        or: "or",
        invalidCredentials:
          "Invalid email or password. Please check your credentials or create a new account.",
        loginFailed: "Login failed",
        enterBothFields: "Please enter both email and password",
        passwordTooShort: "Password must be at least 8 characters long",
        accountCreated:
          "Account created successfully! You can now sign in with your credentials.",
        signUpFailed: "Sign up failed",
        footer: "If you have any problems, contact your administrator"
      },

      // Home Component
      upcoming_events: "Upcoming events",
      active_promotions: "Active promotions",
      date_tba: "Date TBA",
      special_offer: "Special Offer",
      tag_new: "NEW",
      tag_limited: "LIMITED",
      tag_promo: "PROMO",
      tag_past: "PAST",
      tag_this_week: "THIS WEEK",
      tag_popular: "POPULAR",
      tag_upcoming: "UPCOMING",
      event_ended: "Event Ended",
      event_already_taken_place: "This event has already taken place",
      loading_campaigns: "Loading campaigns...",
      oops_something_went_wrong: "Oops! Something went wrong",
      try_again: "Try Again",
      no_campaigns_available: "No campaigns available",
      check_back_later: "Check back later for upcoming events and promotions",

      // Discover Component
      failed_to_load_events: "Failed to load events",
      no_events_available: "No events available",
      unexpected_error_occurred: "An unexpected error occurred",
      location_tba: "Location TBA",
      rsvp_required: "RSVP Required",
      free_event: "Free Event",
      tag_coming_soon: "COMING SOON",
      select: "Select",
      event: "event",
      learn_more: "Learn More",

      // Navigation
      nav: {
        dashboard: "Dashboard",
        campaigns: "Campaigns",
        users: "Users",
        sms: "SMS",
        templates: "Templates",
        settings: "Settings",
        home: "Home",
        discover: "Discover"
      },

      // Layout Navigation Tabs
      layoutTabs: {
        users: "Users",
        import: "Import",
        sms: "SMS",
        campaigns: "Campaigns"
      },

      // Campaign Management
      campaigns: {
        title: "Campaign Management",
        subtitle: "Create and manage your marketing campaigns",
        createCampaign: "Create Campaign",
        editCampaign: "Edit Campaign",
        createNew: "Create New Campaign",
        noCampaigns: "No campaigns yet",
        noCampaignsSubtitle: "Get started by creating your first campaign",
        searchPlaceholder:
          "Search campaigns by name, description, type, or location...",
        foundResults: 'Found {{count}} campaign matching "{{searchTerm}}"',
        foundResults_plural:
          'Found {{count}} campaigns matching "{{searchTerm}}"',
        noResults: "No campaigns found",
        noResultsSubtitle:
          "No campaigns match your search criteria. Try adjusting your search terms.",
        clearSearch: "Clear Search",

        // Form fields
        name: "Campaign Name",
        nameRequired: "Campaign Name *",
        description: "Description",
        descriptionRequired: "Description *",
        type: "Type",
        typeRequired: "Type *",
        image: "Campaign Image",
        date: "Date",
        location: "Location Name",
        locationPlaceholder: "Enter location name (e.g., Sofia Tech Park)",
        mapLocation: "Map Location",
        enableRsvp: "Enable RSVP",

        // Types
        event: "Event",
        promotion: "Promotion",

        // Actions
        public: "Public",

        // Upload
        dropImage: "Drop your image here, or",
        browse: "browse",
        uploadingImage: "Uploading image...",
        imageFormats: "PNG, JPG, GIF, WebP up to 3MB",
        enterImageUrl: "Or enter image URL",
        imageUrlOverride: "Manually entered URL will override uploaded image",

        // Placeholders
        selectType: "Select type",

        // Delete confirmation
        deleteConfirm: "Are you sure you want to delete this campaign?",
        deleteConfirmTitle: "Delete Campaign",
        deleteConfirmMessage:
          "Are you sure you want to delete '{{name}}'? This action cannot be undone.",

        // Validation error messages
        nameRequiredError: "Campaign name is required",
        descriptionRequiredError: "Description is required",
        typeRequiredError: "Campaign type is required",
        imageRequiredError: "Campaign image is required",
        dateRequiredError: "Date and time is required",
        locationRequiredError: "Location name is required",
        latitudeRequiredError: "Please select a location on the map",
        longitudeRequiredError: "Please select a location on the map"
      },

      // Campaign View (Public)
      campaignView: {
        // Loading and errors
        loading: "Loading campaign...",
        loadingSubtitle: "Please wait while we fetch the campaign details",
        failedToLoad: "Failed to load campaign",
        campaignNotFound: "Campaign Not Found",
        invalidLink: "Invalid or expired link",
        invalidLinkExpired: "This link is invalid or has expired.",
        goHome: "Go Home",
        accessRequired: "Access Required",
        verifyPhoneRequired:
          "Please verify your phone number to access this campaign.",
        verifyPhoneNumber: "Verify Phone Number",

        // Campaign details
        details: "Details",
        eventTime: "Event time",
        location: "Location",
        seeMore: "See more",
        seeLess: "See less",

        // Phone verification
        enterPhoneNumber: "Enter your phone number",
        phoneVerificationDescription:
          "To continue, please verify your phone number. This is required for authentication and access to this event.",
        phonePlaceholder: "+359888123456",
        verifying: "Verifying...",
        continue: "Continue",

        // Promotion
        getThisOffer: "Get This Offer",
        contactToClaim: "Contact us to claim this promotion",
        callNow: "Call Now",

        // RSVP
        rsvpAccepted: "You have accepted this invitation",
        rsvpDeclined: "You have declined this invitation",
        willYouAttend: "Will you attend this event?",
        accept: "Accept",
        decline: "Decline",

        // Messages
        anErrorOccurred: "An error occurred",
        thankYouAccepting: "Thank you for accepting!",
        thankYouResponse: "Thank you for your response.",
        failedToUpdateRsvp: "Failed to update RSVP",

        // Campaign tags
        new: "NEW",
        limited: "LIMITED",
        promo: "PROMO",
        past: "PAST",
        thisWeek: "THIS WEEK",
        popular: "POPULАR",
        upcoming: "UPCOMING",

        // Date formatting
        today: "Today at",
        tomorrow: "Tomorrow at",

        // Phone number
        phoneNumber: "+359888123456",
        invalidPhoneNumber: "Please enter a valid phone number",

        // Country
        unknownCountry: "Unknown"
      },

      // Campaign Details
      campaignDetails: {
        title: "Campaign Details",
        subtitle: "Campaign details and recipients",
        backToCampaigns: "Back to Campaigns",
        campaignNotFound: "Campaign not found",
        campaignNotFoundSubtitle:
          "The campaign you're looking for doesn't exist.",

        // Stats
        total: "Total",
        accepted: "Accepted",
        declined: "Declined",
        viewed: "Viewed",

        // Information
        campaignInformation: "Campaign Information",
        publicLink: "Public Link",
        campaignImage: "Campaign Image",
        noImageUploaded: "No image uploaded",

        // Fields
        type: "Type",

        // Public link
        openLink: "Open link",
        publicLinkDescription:
          "This is the public campaign link that can be shared anywhere. Users will be asked to enter their phone number to access personalized features.",
        shortIdNotAvailable:
          "Campaign short ID is not available. Please refresh the page or contact support.",

        // Recipients
        recipients: "Recipients",
        recipientsCount: "Recipients ({{count}})",
        noRecipients: "No recipients yet",
        noRecipientsSubtitle:
          "Recipients will appear here once they are added to this campaign.",

        // Table headers
        recipient: "Recipient",
        contact: "Contact",
        status: "Status",
        responded: "Responded",

        // Recipient details
        noName: "No name",
        viewedDate: "Viewed: {{date}}",
        respondedDate: "Responded: {{date}}",

        // Alert messages
        shortIdNotFound: "Campaign short ID not found."
      },

      // User Management
      users: {
        title: "User Management",
        addUser: "Add User",
        addNewUser: "Add New User",
        editUser: "Edit User",
        deleteUser: "Delete",
        exportUsers: "Export",

        // Stats
        totalUsers: "Total Users",
        active: "Active",
        inactive: "Inactive",
        blocked: "Blocked",

        // Search
        searchUsers: "Search Users",
        searchPlaceholder: "Search by name, phone number, or email...",
        foundUsers: 'Found {{count}} users matching "{{searchTerm}}"',

        // Table
        user: "User",
        phone: "Phone",
        country: "Country",
        status: "Status",
        created: "Created",
        actions: "Actions",

        // Form
        phoneNumber: "Phone Number",
        phoneNumberRequired: "Phone Number *",
        phoneNumberPlaceholder: "+359888123456",
        name: "Name",
        namePlaceholder: "John Doe",
        email: "Email",
        emailPlaceholder: "john@example.com",

        // Validation
        phoneRequired: "Phone number is required",
        phoneInvalid: "Please enter a valid phone number",
        emailInvalid: "Please enter a valid email address",
        nameRecommended: "Name is recommended for better user management",

        // Status
        selectStatus: "Select a status",

        // Messages
        noUsers: "No users found",
        noUsersSubtitle: "Start by importing users or adding them manually.",
        noUsersFiltered: "Try adjusting your search filters.",
        loadingUsers: "Loading users...",
        errorLoading: "Error loading users:",
        errorLoadingSubtitle:
          "Please make sure you have connected to Supabase and set up the database.",

        // Pagination
        itemsPerPage: "Items per page",
        showingResults: "Showing {{start}} to {{end}} of {{total}} users",
        filtered: "filtered",
        pageOf: "Page {{current}} of {{total}}",
        totalUsersCount: "{{count}} total users",

        // Selection
        selected: "{{count}} selected",
        selectedAll: "(all filtered)",
        selectAll: "Select all {{count}}",
        deselectAll: "Deselect All",
        selectAllPage: "Select All",

        // Delete confirmation
        confirmDeletion: "Confirm Deletion",
        confirmBulkDeletion: "Confirm Bulk Deletion",
        deleteUserConfirm:
          'Are you sure you want to delete user "{{name}}"? This action cannot be undone.',
        deleteBulkConfirm:
          "Are you sure you want to delete {{count}} selected users? This action cannot be undone.",
        deleteBulkAllConfirm:
          "Are you sure you want to delete all {{count}} filtered users? This action cannot be undone.",

        // User details
        noName: "No name"
      },

      // User Details
      userDetails: {
        title: "User Details",
        subtitle: "Manage user information and campaign history",
        userNotFound: "User Not Found",
        backToUsers: "Back to Users",
        loadingDetails: "Loading user details...",

        // Actions
        editUser: "Edit User",
        saveChanges: "Save Changes",
        saving: "Saving...",
        updating: "Updating...",

        // Information
        userInformation: "User Information",
        noName: "No name provided",
        phoneNumber: "Phone Number",
        lastContacted: "Last Contacted",

        // Campaign History
        campaignHistory: "Campaign History",
        campaignCount: "{{count}} campaign",
        campaignCount_plural: "{{count}} campaigns",
        noCampaigns: "No campaigns yet",
        noCampaignsSubtitle: "This user hasn't been added to any campaigns.",

        // Table headers
        campaign: "Campaign",
        responded: "Responded",

        // Actions in campaign table
        viewCampaign: "View campaign",
        viewUserLink: "View user's campaign link"
      },

      // Bulk Import
      bulkImport: {
        title: "Bulk Import",
        downloadTemplate: "Download Template",
        importPhoneNumbers: "Import Phone Numbers",
        uploadFile: "Upload File",
        dropFile: "Drop your xlsx file here, or",
        browse: "browse",
        excelFile: "Excel (.xlsx) up to 10MB",
        fileLoaded: "File Loaded",
        readyToImport: "Ready to import {{count}} valid entries",
        includingNames: "including names",
        totalRowsProcessed: "Total rows processed",
        validNumbers: "Valid numbers",
        invalidNumbers: "Invalid numbers",
        validationErrors: "Validation Errors ({{count}})",
        moreErrors: "... and {{count}} more errors",
        manualInput: "Manual Input (disabled when file is loaded)",
        pastePhoneNumbers: "Or Paste Phone Numbers (one per line)",
        enterPhoneNumbers: "Enter phone numbers, one per line...",
        entries: "entries",
        invalidEntries: "{{count}} invalid entries will be skipped",
        importing: "Importing...",
        importFromFile: "Import from File",
        importUsers: "Import Users",
        import: "Import",
        importInstructions: "Import Instructions",
        supportedFormats: "Supported Formats",
        supportedFormatsDescription:
          "Excel (.xlsx) files with name and phone columns, or plain text files with one phone number per line",
        autoDetection: "Auto-Detection",
        autoDetectionDescription:
          "Phone numbers are automatically validated and country detection is applied",
        uploadOrPaste: "Upload or Paste",
        uploadOrPasteDescription:
          "Upload a xlsx file or paste numbers directly",
        sampleFormat: "Sample Format:",
        importResults: "Import Results",
        totalProcessed: "Total Processed",
        successfullyImported: "Successfully Imported",
        newUsersCreated: "New Users Created",
        usersUpdated: "Users Updated",
        failed: "Failed",
        errors: "Errors"
      },

      // SMS Manager
      sms: {
        title: "SMS Messaging",
        testMode: "Test Mode",
        testModeOn: "Test Mode ON",
        testModeOff: "Test Mode OFF",
        testOn: "Test ON",
        testOff: "Test OFF",

        // Test mode notice
        testModeActive: "Test Mode Active",
        testModeDescription:
          "Messages will be validated but not actually sent. No credits will be charged.",

        // Compose
        composeSms: "Compose SMS",
        linkToCampaign: "Link to Campaign",
        noCampaignLink: "No Campaign Link",
        campaignLinkDescription:
          "A personalized campaign link will be added to each SMS message.",

        // Message
        message: "Message",
        templatePreview: "Template Preview",
        messagePlaceholder: "Enter your SMS message...",
        charactersCount: "{{length}}/160 characters",
        smsPartsCount: "{{count}} SMS",
        smsPartsCount_plural: "{{count}} SMS parts",

        // Dynamic link info
        dynamicLinkTitle: "Dynamic Link Placeholder",
        dynamicLinkDescription:
          "Use {{ link }} in your message to insert a personalized campaign link for each recipient.",
        dynamicLinkExample:
          'Example: "Visit our event: {{ link }}" becomes "Visit our event: yourdomain.com/ABC12345"',

        // Variables
        availableVariables: "Available Variables:",

        // Recipients
        recipients: "Recipients",
        allActiveUsers: "All Active Users with Phone Numbers ({{count}})",
        selectedUsers: "Selected Users Only ({{count}} selected)",
        selectUsers: "Select Users",
        searchUsersPlaceholder: "Search users by name, phone, or email...",
        foundUsersMatching: 'Found {{count}} users matching "{{searchTerm}}"',
        noUsersAvailable: "No users available",
        noUsersFound: "No users found matching your search",

        // Send button
        sendSms: "Send SMS to {{count}} Recipients",
        testSms: "Test SMS to {{count}} Recipients",
        send: "Send ({{count}})",
        test: "Test ({{count}})",
        sendingSms: "Sending SMS... {{progress}}%",
        testingSms: "Testing SMS... {{progress}}%",
        sending: "Sending... {{progress}}%",
        testing: "Testing... {{progress}}%",
        uploading: "Uploading...",
        createCampaign: "Create Campaign",
        updateCampaign: "Update Campaign",

        // Results
        smsTestSuccessful: "SMS Test Successful!",
        smsSentSuccessfully: "SMS Sent Successfully!",
        smsSendingFailed: "SMS Sending Failed",
        testValidated: "Test validated {{count}} SMS messages",
        successfullySent: "Successfully sent {{count}} SMS messages",
        smsSendError: "An error occurred while sending SMS.",
        costInfo: "(Cost: €{{cost}})",
        individualErrors: "Individual send errors:",
        moreErrors: "... and {{count}} more errors",
        invalidNumbers: "Invalid numbers:",
        noValidRecipients: "No valid recipients selected",

        // Stats
        smsStats: "SMS Stats",
        estimatedCost: "Est. Cost",
        costAmount: "~{{cost}} BGN",

        // Guidelines
        smsBestPractices: "SMS Best Practices",
        keepUnder160: "Keep messages under 160 characters",
        useLink: "Use {{ link }} for personalized campaign links",
        includeOptOut: "Include opt-out instructions",
        personalizeVariables: "Personalize with variables",
        testBeforeSend: "Test before bulk sending",
        monitorDelivery: "Monitor delivery rates",
        clearSender: "Use clear sender identification",
        respectTimeZones: "Respect time zones and hours",
        complyRegulations: "Comply with local regulations",

        // Recent campaigns
        recentSmsCampaigns: "Recent SMS Campaigns",
        loadingRecent: "Loading recent campaigns...",
        noSmsCampaigns: "No SMS campaigns yet",
        noSmsCampaignsSubtitle: "Your recent SMS campaigns will appear here",

        // Table headers
        campaignName: "Campaign Name",
        sent: "Sent",
        successful: "Successful",
        unsuccessful: "Unsuccessful",
        directSms: "Direct SMS",
        status: "Status",
        date: "Date",

        // Status
        completed: "completed",
        failed: "failed",
        sendingStatus: "sending",

        // Additional strings from SMSManager.tsx
        successRate: "{{rate}}% success"
      },
      // Layout
      layout: {
        goToPublicSite: "Go to public site",
        signOut: "Sign out",
        footer: "© {{year}} Events - Head Hunters. All rights reserved."
      },

      // Language Switcher
      languageSwitcher: {
        switchToBulgarian: "Switch to Bulgarian",
        switchToEnglish: "Switch to English",
        english: "English",
        bulgarian: "Bulgarian"
      }
    }
  },
  bg: {
    translation: {
      // Common
      loading: "Зареждане...",
      error: "Грешка",
      save: "Запази",
      cancel: "Отказ",
      delete: "Изтрий",
      edit: "Редактирай",
      view: "Виж",
      create: "Създай",
      update: "Обнови",
      search: "Търси",
      clear: "Изчисти",
      copy: "Копирай",
      copied: "Копирано!",
      close: "Затвори",
      back: "Назад",
      next: "Напред",
      previous: "Назад",
      yes: "Да",
      no: "Ne",
      add: "Добави",
      remove: "Премахни",

      // Login
      login: {
        subtitle:
          "Влезте в системата за управление на вашата комуникационна платформа",
        emailAddress: "Имейл адрес",
        emailPlaceholder: "Въведете вашия имейл",
        password: "Парола",
        passwordPlaceholder: "Въведете вашата парола",
        signIn: "Влез",
        signingIn: "Влизане...",
        createNewAccount: "Създай нов акаунт",
        or: "или",
        invalidCredentials:
          "Невалиден имейл или парола. Моля, проверете вашите данни или създайте нов акаунт.",
        loginFailed: "Влизане неуспешно",
        enterBothFields: "Моля, въведете имейл и парола",
        passwordTooShort: "Паролата трябва да бъде поне 8 символа дълга",
        accountCreated:
          "Акаунтът е създаден успешно! Сега можете да влезете с вашите данни.",
        signUpFailed: "Регистрация неуспешна",
        footer: "Ако имате проблеми, свържете се с администратора си"
      },

      // Home Component
      upcoming_events: "Предстоящи събития",
      active_promotions: "Активни промоции",
      date_tba: "Дата TBA",
      special_offer: "Специална оферта",
      tag_new: "НОВО",
      tag_limited: "ОГРАНИЧЕНО",
      tag_promo: "ПРОМО",
      tag_past: "МИНАЛО",
      tag_this_week: "ТАЗИ СЕДМИЦА",
      tag_popular: "ПОПУЛЯРНО",
      tag_upcoming: "ПРЕДСТОЯЩО",
      event_ended: "Събитие завърши",
      event_already_taken_place: "Тази събитие вече е минало",
      loading_campaigns: "Зареждане на кампании...",
      oops_something_went_wrong: "Опа, нещо се обърка",
      try_again: "Опитайте отново",
      no_campaigns_available: "Няма налични кампании",
      check_back_later:
        "Моля, проверете отново по-късно за предстоящи събития и промоции",

      // Discover Component
      failed_to_load_events: "Неуспешно зареждане на събития",
      no_events_available: "Няма налични събития",
      unexpected_error_occurred: "Възникна неочаквана грешка",
      location_tba: "Местоположение TBA",
      rsvp_required: "RSVP Задължително",
      free_event: "Безплатно събитие",
      tag_coming_soon: "СКОРО",
      select: "Избери",
      event: "събитие",
      learn_more: "Научи повече",

      // Navigation
      nav: {
        dashboard: "Табло",
        campaigns: "Кампании",
        users: "Потребители",
        sms: "SMS",
        templates: "Шаблони",
        settings: "Настройки",
        home: "Начало",
        discover: "Открий"
      },

      // Layout Navigation Tabs
      layoutTabs: {
        users: "Потребители",
        import: "Импортиране",
        sms: "SMS",
        campaigns: "Кампании"
      },

      // Campaign Management
      campaigns: {
        title: "Управление на кампании",
        subtitle: "Създавайте и управлявайте вашите маркетингови кампании",
        createCampaign: "Създай кампания",
        editCampaign: "Редактирай кампания",
        createNew: "Създай нова кампания",
        noCampaigns: "Все още няма кампании",
        noCampaignsSubtitle: "Започнете като създадете първата си кампания",
        searchPlaceholder:
          "Търсете кампании по име, описание, тип или местоположение...",
        foundResults:
          'Намерена {{count}} кампания съответстваща на "{{searchTerm}}"',
        foundResults_plural:
          'Намерени {{count}} кампании съответстващи на "{{searchTerm}}"',
        noResults: "Няма намерени кампании",
        noResultsSubtitle:
          "Няма кампании, които съответстват на критериите за търсене. Опитайте да промените търсачките термини.",
        clearSearch: "Изчисти търсенето",

        // Form fields
        name: "Име на кампанията",
        nameRequired: "Име на кампанията *",
        description: "Описание",
        descriptionRequired: "Описание *",
        type: "Тип",
        typeRequired: "Тип *",
        image: "Изображение на кампанията",
        date: "Дата",
        location: "Име на местоположението",
        locationPlaceholder:
          "Въведете име на местоположението (напр. София Тек Парк)",
        mapLocation: "Местоположение на картата",
        enableRsvp: "Активирай RSVP",

        // Types
        event: "Събитие",
        promotion: "Промоция",

        // Actions
        public: "Линк",

        // Upload
        dropImage: "Пуснете изображението тук, или",
        browse: "прегледайте",
        uploadingImage: "Качване на изображение...",
        imageFormats: "PNG, JPG, GIF, WebP до 3MB",
        enterImageUrl: "Или въведете URL адрес на изображение",
        imageUrlOverride: "Ръчно въведеният URL ще замени каченото изображение",

        // Placeholders
        selectType: "Изберете тип",

        // Delete confirmation
        deleteConfirm: "Сигурни ли сте, че искате да изтриете тази кампания?",
        deleteConfirmTitle: "Изтриване на кампания",
        deleteConfirmMessage:
          "Сигурни ли сте, че искате да изтриете '{{name}}'? Това действие не може да бъде отменено.",

        // Validation error messages
        nameRequiredError: "Името на кампанията е задължително",
        descriptionRequiredError: "Описанието е задължително",
        typeRequiredError: "Типът на кампанията е задължителен",
        imageRequiredError: "Изображението на кампанията е задължително",
        dateRequiredError: "Датата и часът са задължителни",
        locationRequiredError: "Името на местоположението е задължително",
        latitudeRequiredError: "Моля, изберете местоположение на картата",
        longitudeRequiredError: "Моля, изберете местоположение на картата"
      },

      // Campaign View (Public)
      campaignView: {
        // Loading and errors
        loading: "Зареждане на кампанията...",
        loadingSubtitle:
          "Моля, изчакайте докато изтеглим детайлите на кампанията",
        failedToLoad: "Неуспешно зареждане на кампанията",
        campaignNotFound: "Кампанията не е намерена",
        invalidLink: "Невалидна или изтекла връзка",
        invalidLinkExpired: "Тази връзка е невалидна или е изтекла.",
        goHome: "Върни се в началото",
        accessRequired: "За достъп е необходима автентикация",
        verifyPhoneRequired:
          "Моля, удостовердете вашия телефонен номер за достъп до тази кампания.",
        verifyPhoneNumber: "Удостовердете телефонен номер",

        // Детайли на кампанията
        details: "Детайли",
        eventTime: "Време на събитието",
        location: "Местоположение",
        seeMore: "Виж повече",
        seeLess: "Виж по-малко",

        // Телефонно удостоверяване
        enterPhoneNumber: "Въведете вашия телефонен номер",
        phoneVerificationDescription:
          "За да продължите, моля, удостовердете вашия телефонен номер. Това е необходимо за автентикация и достъп до събитието.",
        phonePlaceholder: "+359888123456",
        verifying: "Удостоверяване...",
        continue: "Продължи",

        // Промоция
        getThisOffer: "Получете тази оферта",
        contactToClaim: "Свържете се с нас за да претендирате за тази промоция",
        callNow: "Позвънете сега",

        // RSVП
        rsvpAccepted: "Вие сте приели тази покана",
        rsvpDeclined: "Вие сте отказали тази покана",
        willYouAttend: "Ще присъствате ли на това събитие?",
        accept: "Приемете",
        decline: "Откажете",

        // Messages
        anErrorOccurred: "Възникна грешка",
        thankYouAccepting: "Благодаря ви за потвърждението!",
        thankYouResponse: "Благодаря ви за вашия отговор.",
        failedToUpdateRsvp: "Неуспешно актуализиране на RSVП",

        // Campaign tags
        new: "НОВО",
        limited: "ОГРАНИЧЕНО",
        promo: "ПРОМО",
        past: "МИНАЛО",
        thisWeek: "ТАЗИ СЕДМИЦА",
        popular: "ПОПУЛЯРНО",
        upcoming: "ПРЕДСТОЯЩО",

        // Date formatting
        today: "Днес в",
        tomorrow: "Утре в",

        // Phone number
        phoneNumber: "+359888123456",
        invalidPhoneNumber: "Моля, въведете валиден телефонен номер",

        // Country
        unknownCountry: "Неизвестно"
      },

      // Campaign Details
      campaignDetails: {
        title: "Детайли на кампанията",
        subtitle: "Детайли на кампанията и получатели",
        backToCampaigns: "Назад към кампаниите",
        campaignNotFound: "Кампанията не е намерена",
        campaignNotFoundSubtitle: "Кампанията, която търсите, не съществува.",

        // Stats
        total: "Общо",
        accepted: "Приети",
        declined: "Отказани",
        viewed: "Видени",

        // Information
        campaignInformation: "Информация за кампанията",
        publicLink: "Публична връзка",
        campaignImage: "Изображение на кампанията",
        noImageUploaded: "Няма качено изображение",

        // Fields
        type: "Тип",

        // Публична връзка
        openLink: "Отвори връзката",
        publicLinkDescription:
          "Това е публичната връзка на кампанията, която може да се споделя навсякъде. Потребителите ще бъдат помолени да въведат телефонния си номер за достъп до персонализирани функции.",
        shortIdNotAvailable:
          "Краткият ID на кампанията не е наличен. Моля, обновете страницата или се свържете с поддръжката.",

        // Получатели
        recipients: "Получатели",
        recipientsCount: "Получатели ({{count}})",
        noRecipients: "Все още няма получатели",
        noRecipientsSubtitle:
          "Получателите ще се появят тук, след като бъдат добавени към тази кампания.",

        // Таблични заглавия
        recipient: "Получател",
        contact: "Контакт",
        status: "Статус",
        responded: "Отговорил",

        // Детайли за получател
        noName: "Няма име",
        viewedDate: "Видяно: {{date}}",
        respondedDate: "Отговорил: {{date}}",

        // Съобщения за предупреждение
        shortIdNotFound: "Краткият ID на кампанията не е намерен."
      },

      // Управление на потребители
      users: {
        title: "Управление на потребители",
        addUser: "Добави нов",
        addNewUser: "Добави нов потребител",
        editUser: "Редактирай потребител",
        deleteUser: "Изтрий",
        exportUsers: "Експортирай",

        // Статистика
        totalUsers: "Общо потребители",
        active: "Активен",
        inactive: "Неактивен",
        blocked: "Блокиран",

        // Търсене
        searchUsers: "Търсене на потребители",
        searchPlaceholder: "Търсене по име, телефонен номер или имейл...",
        foundUsers:
          'Намерени {{count}} потребители съответстващи на "{{searchTerm}}"',

        // Таблица
        user: "Потребител",
        phone: "Телефон",
        country: "Страна",
        status: "Статус",
        created: "Създаден",
        actions: "Действия",

        // Форма
        phoneNumber: "Телефонен номер",
        phoneNumberRequired: "Телефонен номер *",
        phoneNumberPlaceholder: "+359888123456",
        name: "Име",
        namePlaceholder: "Иван Иванов",
        email: "Имейл",
        emailPlaceholder: "ivan@example.com",

        // Валидация
        phoneRequired: "Телефонният номер е задължителен",
        phoneInvalid: "Моля въведете валиден телефонен номер",
        emailInvalid: "Моля въведете валиден имейл адрес",
        nameRecommended:
          "Името се препоръчва за по-добро управление на потребителите",

        // Статус
        selectStatus: "Изберете статус",

        // Съобщения
        noUsers: "Няма намерени потребители",
        noUsersSubtitle:
          "Започнете като импортирате потребители или ги добавите ръчно.",
        noUsersFiltered: "Опитайте да промените филтрите за търсене.",
        loadingUsers: "Зареждане на потребители...",
        errorLoading: "Грешка при зареждане на потребители:",
        errorLoadingSubtitle:
          "Моля уверете се, че сте свързани към Supabase и сте настроили базата данни.",

        // Пагинация
        itemsPerPage: "Покажи по",
        showingResults:
          "Показване на {{start}} до {{end}} от {{total}} потребители",
        filtered: "филтрирани",
        pageOf: "Страница {{current}} от {{total}}",
        totalUsersCount: "{{count}} общо потребители",

        // Избор
        selected: "{{count}} избрани",
        selectedAll: "(всички филтрирани)",
        selectAll: "Избери всички {{count}}",
        deselectAll: "Отмени избора на всички",
        selectAllPage: "Избери всички",

        // Потвърждение за изтриване
        confirmDeletion: "Потвърди изтриването",
        confirmBulkDeletion: "Потвърди масовото изтриване",
        deleteUserConfirm:
          'Сигурни ли сте, че искате да изтриете потребител "{{name}}"? Това действие не може да бъде отменено.',
        deleteBulkConfirm:
          "Сигурни ли сте, че искате да изтриете {{count}} избрани потребители? Това действие не може да бъде отменено.",
        deleteBulkAllConfirm:
          "Сигурни ли сте, че искате да изтриете всички {{count}} филтрирани потребители? Това действие не може да бъде отменено.",

        // Детайли за потребител
        noName: "Няма име"
      },

      // Детайли за потребител
      userDetails: {
        title: "Детайли за потребителя",
        subtitle:
          "Управлявайте информацията за потребителя и историята на кампаниите",
        userNotFound: "Потребителят не е намерен",
        backToUsers: "Назад към потребителите",
        loadingDetails: "Зареждане на детайлите за потребителя...",

        // Действия
        editUser: "Редактирай",
        saveChanges: "Запази промените",
        saving: "Запазване...",
        updating: "Обновяване...",

        // Информация
        userInformation: "Информация за потребителя",
        noName: "Не е предоставено име",
        phoneNumber: "Телефонен номер",
        lastContacted: "Последен контакт",

        // История на кампаниите
        campaignHistory: "История на кампаниите",
        campaignCount: "{{count}} кампания",
        campaignCount_plural: "{{count}} кампании",
        noCampaigns: "Все още няма кампании",
        noCampaignsSubtitle:
          "Този потребител не е бил добавен към никакви кампании.",

        // Таблични заглавия
        campaign: "Кампания",
        responded: "Отговорил",

        // Действия в таблицата за кампании
        viewCampaign: "Виж кампанията",
        viewUserLink: "Виж връзката на потребителя към кампанията"
      },

      // Масово импортиране
      bulkImport: {
        title: "Масово импортиране",
        downloadTemplate: "Изтегли шаблон",
        importPhoneNumbers: "Импортиране на телефонни номера",
        uploadFile: "Качване на файл",
        dropFile: "Пуснете вашия xlsx файл тук, или",
        browse: "прегледайте",
        excelFile: "Excel (.xlsx) до 10MB",
        fileLoaded: "Файлът е зареден",
        readyToImport: "Готов за импортиране на {{count}} валидни записи",
        includingNames: "включително имена",
        totalRowsProcessed: "Общо обработени редове",
        validNumbers: "Валидни номера",
        invalidNumbers: "Невалидни номера",
        validationErrors: "Грешки при валидация ({{count}})",
        moreErrors: "... и {{count}} повече грешки",
        manualInput: "Ръчно въвеждане (деактивирано при зареден файл)",
        pastePhoneNumbers: "Или поставете телефонни номера (един за ред)",
        enterPhoneNumbers: "Въведете телефонни номера, един за ред...",
        entries: "записи",
        invalidEntries: "{{count}} невалидни записи ще бъдат пропуснати",
        importing: "Импортиране...",
        importFromFile: "Импортиране от файл",
        importUsers: "Импортиране на потребители",
        import: "Импортиране",
        importInstructions: "Инструкции за импортиране",
        supportedFormats: "Поддържани формати",
        supportedFormatsDescription:
          "Excel (.xlsx) файлове с колони за име и телефон, или обикновени текстови файлове с един телефонен номер за ред",
        autoDetection: "Автоматично откриване",
        autoDetectionDescription:
          "Телефонните номера се валидират автоматично и се прилага откриване на държава",
        uploadOrPaste: "Качване или поставяне",
        uploadOrPasteDescription:
          "Качете xlsx файл или поставете номера директно",
        sampleFormat: "Пример за формат:",
        importResults: "Резултати от импортиране",
        totalProcessed: "Общо обработени",
        successfullyImported: "Успешно импортирани",
        newUsersCreated: "Нови потребители създадени",
        usersUpdated: "Потребители обновени",
        failed: "Неуспешно",
        errors: "Грешки"
      },

      // SMS съобщения
      sms: {
        title: "SMS съобщения",
        testMode: "Тестов режим",
        testModeOn: "Тестов режим ВКЛЮЧЕН",
        testModeOff: "Тестов режим ИЗКЛЮЧЕН",
        testOn: "Тест ВКЛ",
        testOff: "Тест ИЗКЛ",

        // Тестов режим уведомление
        testModeActive: "Тестовият режим е активен",
        testModeDescription:
          "Съобщенията ще бъдат валидирани, но няма да бъдат изпратени на истина. Няма да бъдат начислени кредити.",

        // Съставяне
        composeSms: "Съставяне на SMS",
        linkToCampaign: "Свърже с кампания",
        noCampaignLink: "Няма избрана кампания",
        campaignLinkDescription:
          "Персонализирана връзка към кампанията ще бъде добавена към всяко SMS съобщение.",

        // Съобщение
        message: "Съобщение",
        templatePreview: "Преглед на шаблона",
        messagePlaceholder: "Въведете вашето SMS съобщение...",
        charactersCount: "{{length}}/160 символа",
        smsPartsCount: "{{count}} SMS",
        smsPartsCount_plural: "{{count}} SMS части",

        // Динамична връзка информация
        dynamicLinkTitle: "Динамичен заместител на връзката",
        dynamicLinkDescription:
          "Използвайте {{ link }} в съобщението си, за да вмъкнете персонализирана връзка към кампанията за всеки получател.",
        dynamicLinkExample:
          'Пример: "Посетете нашето събитие: {{ link }}" се превръща в "Посетете нашето събитие: yourdomain.com/ABC12345"',

        // Променливи
        availableVariables: "Налични променливи:",

        // Получатели
        recipients: "Получатели",
        allActiveUsers:
          "Всички активни потребители с телефонни номера ({{count}})",
        selectedUsers: "Само избрани потребители ({{count}} избрани)",
        selectUsers: "Изберете потребители",
        searchUsersPlaceholder:
          "Търсете потребители по име, телефон или имейл...",
        foundUsersMatching:
          'Намерени {{count}} потребители съответстващи на "{{searchTerm}}"',
        noUsersAvailable: "Няма налични потребители",
        noUsersFound: "Няма намерени потребители съответстващи на търсенето ви",

        // Бутон за изпращане
        sendSms: "Изпрати SMS до {{count}} получатели",
        testSms: "Тествай SMS до {{count}} получатели",
        send: "Изпрати ({{count}})",
        test: "Тествай ({{count}})",
        sendingSms: "Изпращане на SMS... {{progress}}%",
        testingSms: "Тестване на SMS... {{progress}}%",
        sending: "Изпращане... {{progress}}%",
        testing: "Тестване... {{progress}}%",
        uploading: "Качване...",
        createCampaign: "Създай кампания",
        updateCampaign: "Обнови кампания",

        // Резултати
        smsTestSuccessful: "Успешен SMS тест!",
        smsSentSuccessfully: "SMS изпратен успешно!",
        smsSendingFailed: "Неуспешно изпращане на SMS",
        testValidated: "Тестът валидира {{count}} SMS съобщения",
        successfullySent: "Успешно изпратени {{count}} SMS съобщения",
        smsSendError: "Възникна грешка при изпращането на SMS.",
        costInfo: "(Цена: €{{cost}})",
        individualErrors: "Индивидуални грешки при изпращане:",
        moreErrors: "... и още {{count}} грешки",
        invalidNumbers: "Невалидни номера:",
        noValidRecipients: "Няма избрани валидни получатели",

        // Статистика
        smsStats: "SMS статистики",
        estimatedCost: "Приблизителна цена",
        costAmount: "~{{cost}} лв.",

        // Ръководства
        smsBestPractices: "Най-добри практики за SMS",
        keepUnder160: "Поддържайте съобщенията под 160 символа",
        useLink:
          "Използвайте {{ link }} за персонализирани връзки към кампании",
        includeOptOut: "Включете инструкции за отказ",
        personalizeVariables: "Персонализирайте с променливи",
        testBeforeSend: "Тествайте преди масово изпращане",
        monitorDelivery: "Наблюдавайте процентите на доставка",
        clearSender: "Използвайте ясна идентификация на изпращача",
        respectTimeZones: "Спазвайте часовите зони и часовете",
        complyRegulations: "Спазвайте местните регулации",

        // Последни кампании
        recentSmsCampaigns: "Последни SMS кампании",
        loadingRecent: "Зареждане на последни кампании...",
        noSmsCampaigns: "Все още няма SMS кампании",
        noSmsCampaignsSubtitle: "Вашите последни SMS кампании ще се появят тук",

        // Таблични заглавия
        campaignName: "Име на кампанията",
        sent: "Изпратени",
        successful: "Успешни",
        unsuccessful: "Неуспешни",
        directSms: "Директен SMS",
        status: "Статус",
        date: "Дата",

        // Статус
        completed: "Завършено",
        failed: "Неуспешно",
        sendingStatus: "Изпращане",

        // Допълнителни низове от SMSManager.tsx
        successRate: "{{rate}}% успех"
      },
      // Layout
      layout: {
        goToPublicSite: "Отиди в публичния сайт",
        signOut: "Излез",
        footer: "© {{year}} Events - Head Hunters. Всички права запазени."
      },

      // Language Switcher
      languageSwitcher: {
        switchToBulgarian: "Превключи на български",
        switchToEnglish: "Превключи на английски",
        english: "Английски",
        bulgarian: "Български"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
