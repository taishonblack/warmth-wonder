import { ArrowLeft, Shield, Key, Download, Trash2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function Settings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = () => {
    // TODO: Implement password change
    console.log("Change password");
  };

  const handleSetup2FA = () => {
    // TODO: Implement 2FA setup
    setTwoFactorEnabled(!twoFactorEnabled);
    console.log("Toggle 2FA");
  };

  const handleDownloadData = () => {
    // TODO: Implement data download
    console.log("Download activity data");
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    console.log("Delete account");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 flex items-center gap-4 border-b border-border">
        <Link
          to="/profile"
          className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-bold text-primary">Settings</h1>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Security Section */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            Security
          </h2>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <Separator />

            {/* 2FA */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled ? "Enabled" : "Add an extra layer of security"}
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleSetup2FA}
              />
            </div>
          </div>
        </section>

        {/* Data & Privacy Section */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-secondary" />
            Data & Privacy
          </h2>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Download Activity */}
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Download Your Data</p>
                  <p className="text-sm text-muted-foreground">
                    Get a copy of all your activity on Nearish
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-accent flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>

          <div className="bg-card rounded-xl border border-accent/30 overflow-hidden">
            <div className="p-4">
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
