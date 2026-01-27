// Language Selector Component Example
// Add this component to your App.js header

const LanguageSelector = () => {
    const { i18n } = useTranslation();

    return (
        <div className="flex items-center gap-2">
            <Globe size={20} className="text-gray-600" />
            <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
            </select>
        </div>
    );
};

// Usage in header:
// Add <LanguageSelector /> next to the logout button

// Example header with language selector:
{
    isAuthenticated && (
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Leaf className="text-green-600" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">{t('app_name')}</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Language Selector */}
                <LanguageSelector />

                {/* User Info */}
                <div className="text-sm">
                    <p className="font-medium">{currentUser?.full_name}</p>
                    <p className="text-gray-600">{t(`roles.${currentUser?.role}`)}</p>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                    <LogOut size={20} />
                    {t('auth.logout')}
                </button>
            </div>
        </div>
    )
}

// PWA Install Banner (add at top of authenticated view)
{
    showInstallPrompt && (
        <div className="bg-green-600 text-white px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Download size={24} />
                <span className="font-medium">{t('messages.install_app')}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleInstallClick}
                    className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50"
                >
                    {t('common.submit')}
                </button>
                <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="text-white hover:bg-green-700 px-4 py-2 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    )
}

// Offline Indicator (add at top of authenticated view)
{
    !isOnline && (
        <div className="bg-yellow-500 text-white px-6 py-2 flex items-center justify-center gap-2">
            <WifiOff size={20} />
            <span>{t('messages.offline')}</span>
        </div>
    )
}
