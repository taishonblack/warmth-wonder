import { CheckCircle2, Loader2 } from "lucide-react";

interface Verification {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  fieldName: string;
  fieldValue: string;
  timestamp: string;
}

interface VerificationHistoryProps {
  verifications: Verification[];
  loading: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  organic: "Organic Products",
  vegan_friendly: "Vegan-Friendly",
  gluten_free: "Gluten-Free Options",
  hours: "Operating Hours",
  is_open: "Open Status",
  description: "Description",
  phone: "Phone Number",
  website: "Website",
};

const FIELD_ICONS: Record<string, string> = {
  organic: "🌿",
  vegan_friendly: "💚",
  gluten_free: "🌾",
  hours: "🕐",
  is_open: "📍",
  description: "📝",
  phone: "📞",
  website: "🌐",
};

export function VerificationHistory({ verifications, loading }: VerificationHistoryProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="font-medium text-foreground mb-1">No verifications yet</h3>
        <p className="text-sm text-muted-foreground">
          Be the first to verify details about this market!
        </p>
      </div>
    );
  }

  // Group verifications by field
  const groupedVerifications = verifications.reduce((acc, v) => {
    if (!acc[v.fieldName]) {
      acc[v.fieldName] = [];
    }
    acc[v.fieldName].push(v);
    return acc;
  }, {} as Record<string, Verification[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedVerifications).map(([fieldName, fieldVerifications]) => (
        <div key={fieldName} className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{FIELD_ICONS[fieldName] || "✓"}</span>
            <h4 className="font-medium text-foreground">
              {FIELD_LABELS[fieldName] || fieldName}
            </h4>
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {fieldVerifications.length} verification{fieldVerifications.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Most recent value */}
          <p className="text-sm text-muted-foreground mb-3 font-medium">
            Current: {fieldVerifications[0].fieldValue === "true" ? "Yes" : 
                      fieldVerifications[0].fieldValue === "false" ? "No" : 
                      fieldVerifications[0].fieldValue}
          </p>

          {/* Verification history */}
          <div className="space-y-2">
            {fieldVerifications.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-sm">
                <img
                  src={v.userAvatar}
                  alt={v.userName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-muted-foreground">
                  <span className="text-foreground font-medium">{v.userName}</span>
                  {" verified "}
                  <span className="text-foreground">
                    {v.fieldValue === "true" ? "Yes" : 
                     v.fieldValue === "false" ? "No" : 
                     v.fieldValue}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{v.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
