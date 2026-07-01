"use client";

const SettingsPage = () => {

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
          Configure your account and preferences.
        </p>
      </div>

      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-6">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Coming Soon</h2>
          <p className="text-zinc-500 max-w-sm">
            We're working on enhanced settings and customization options. Check back soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
