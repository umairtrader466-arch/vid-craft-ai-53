import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 4, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2">
          <h2>1. Introduction</h2>
          <p>
            VidCraft AI ("we", "our", or "us") operates the VidCraft AI application (the "Service"). 
            This Privacy Policy explains how we collect, use, disclose, and protect your information 
            when you use our Service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your email address and display name. 
            We use this information to authenticate your identity and provide our Service.
          </p>

          <h3>Video Content</h3>
          <p>
            We store video topics, generated scripts, voice-over audio, and rendered video files 
            that you create through the Service. This content is associated with your user account 
            and is necessary to deliver the core functionality of the Service.
          </p>

          <h3>YouTube API Data</h3>
          <p>
            When you connect your YouTube account, we access and store OAuth tokens (access token 
            and refresh token) to upload videos on your behalf. We request the following scope:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/youtube.upload</code> — to upload videos to your YouTube channel</li>
          </ul>
          <p>
            We do <strong>not</strong> access your YouTube watch history, subscriptions, playlists, 
            or any other YouTube data beyond uploading videos you explicitly choose to upload.
          </p>

          <h3>Usage Data</h3>
          <p>
            We may collect information about how you interact with the Service, including video 
            creation counts and feature usage, to improve our product and enforce usage limits.
          </p>

          <h2>3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide, maintain, and improve the Service</li>
            <li>To authenticate your identity and manage your account</li>
            <li>To upload videos to YouTube on your behalf when you choose to do so</li>
            <li>To enforce usage limits and prevent abuse</li>
            <li>To communicate with you about the Service</li>
          </ul>

          <h2>4. YouTube API Services</h2>
          <p>
            Our use of information received from Google APIs adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" 
               target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.
          </p>
          <p>
            You can revoke our access to your YouTube account at any time by:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Disconnecting YouTube in the Settings tab of the application</li>
            <li>Revoking access through your{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" 
                 rel="noopener noreferrer" className="text-primary hover:underline">
                Google Account permissions
              </a>
            </li>
          </ul>

          <h2>5. Data Storage & Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption and access controls. 
            YouTube OAuth tokens are stored in our secure database and are only used to upload 
            videos on your behalf. We do not share your tokens with any third parties.
          </p>

          <h2>6. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information. We may share data only in 
            the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent abuse</li>
          </ul>

          <h2>7. Data Retention & Deletion</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion 
            of your account and associated data by contacting us. Upon account deletion, we will 
            remove your personal data, including stored YouTube tokens, within 30 days.
          </p>

          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Revoke YouTube access at any time</li>
            <li>Export your data</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:support@vidcraftai.com" className="text-primary hover:underline">
              support@vidcraftai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
