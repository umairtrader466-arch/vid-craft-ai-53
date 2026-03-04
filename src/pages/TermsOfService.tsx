import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 4, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using VidCraft AI ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            VidCraft AI is a video creation platform that allows users to generate scripts, 
            voice-overs, and videos from topics. The Service also provides optional YouTube 
            integration for uploading created videos directly to your YouTube channel.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            You must create an account to use the Service. You are responsible for maintaining 
            the confidentiality of your account credentials and for all activities under your account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Generate content that violates YouTube's Community Guidelines or Terms of Service</li>
            <li>Attempt to circumvent usage limits or security measures</li>
            <li>Share your account credentials with others</li>
            <li>Use the Service to create spam, misleading, or harmful content</li>
            <li>Reverse-engineer or attempt to extract the source code of the Service</li>
          </ul>

          <h2>5. YouTube Integration</h2>
          <p>
            By connecting your YouTube account, you authorize VidCraft AI to upload videos 
            on your behalf. You are solely responsible for the content you upload to YouTube 
            and must comply with YouTube's Terms of Service and Community Guidelines.
          </p>
          <p>
            You may disconnect your YouTube account at any time through the Settings tab. 
            Disconnecting will revoke our ability to upload videos on your behalf.
          </p>

          <h2>6. Content Ownership</h2>
          <p>
            You retain ownership of the content you create using the Service. By using the 
            Service, you grant us a limited license to process, store, and transmit your 
            content as necessary to provide the Service.
          </p>

          <h2>7. Usage Limits</h2>
          <p>
            The Service may impose limits on the number of videos you can create per month. 
            These limits may vary and can be adjusted at our discretion. We reserve the right 
            to suspend accounts that violate usage policies.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, 
            whether express or implied. We do not guarantee that the Service will be uninterrupted, 
            error-free, or secure.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, VidCraft AI shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising from 
            your use of the Service.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violations 
            of these Terms or for any other reason at our discretion. Upon termination, your 
            right to use the Service will immediately cease.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the 
            Service after changes constitutes acceptance of the updated Terms.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:support@vidcraftai.com" className="text-primary hover:underline">
              support@vidcraftai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
