/**
 * Mock product documentation for the Researcher Subagent
 * In a real implementation, this would connect to an actual knowledge base or documentation system
 */

const mockDocumentation = [
  {
    id: "doc-001",
    title: "VPN Connection Troubleshooting Guide",
    content: "To resolve VPN connection issues: 1) Check your internet connection, 2) Verify VPN server address is correct, 3) Ensure your credentials are up to date, 4) Try restarting the VPN client, 5) Check if your company firewall is blocking VPN ports (typically UDP 500, 4500 and ESP protocol 50), 6) Contact IT if the issue persists after trying these steps.",
    topic: "network",
    keywords: ["vpn", "connection", "troubleshooting", "internet", "credentials", "firewall", "ports"]
  },
  {
    id: "doc-002",
    title: "Outlook Email Synchronization Fixes",
    content: "To fix Outlook not syncing: 1) Restart Outlook application, 2) Check your internet connection, 3) Run Outlook in safe mode to rule out add-in conflicts, 4) Repair Outlook data files using ScanPST.exe, 5) Check for Outlook updates, 6) Create a new Outlook profile if corruption is suspected, 7) Verify Exchange server settings with your IT department.",
    topic: "software",
    keywords: ["outlook", "email", "sync", "synchronization", "calendar", "contacts", "repair", "profile"]
  },
  {
    id: "doc-003",
    title: "Laptop Camera Detection and Driver Issues",
    content: "If your laptop camera is not detected: 1) Check Device Manager for camera under Imaging devices, 2) Update or reinstall camera drivers, 3) Check privacy settings to ensure camera access is enabled, 4) Run hardware diagnostics from BIOS/UEFI, 5) Test with different applications (Teams, Zoom, Camera app), 6) Check if camera is physically disabled via function key, 7) Consider system restore if issue started after recent update.",
    topic: "hardware",
    keywords: ["camera", "webcam", "laptop", "driver", "device manager", "privacy", "imaging", "detection"]
  },
  {
    id: "doc-004",
    title: "Password Reset and Account Lockout Procedures",
    content: "For password reset or account lockout: 1) Use the self-service password reset portal at https://passwordreset.company.com, 2) Ensure you have access to your registered email or phone for verification, 3) Follow the prompts to verify identity and set new password, 4) If self-service fails, contact the IT helpdesk with your employee ID for manual reset, 5) Account lockouts typically reset automatically after 15-30 minutes.",
    topic: "security",
    keywords: ["password", "reset", "lockout", "account", "credentials", "authentication", "self-service", "portal"]
  },
  {
    id: "doc-005",
    title: "Software Installation and Updates Guide",
    content: "To install or update company software: 1) Open Software Center from Start menu, 2) Browse available applications or check for updates, 3) Select desired software and click Install, 4) Wait for installation to complete (may require restart), 5) For admin-restricted software, submit request through IT service portal, 6) Always verify software authenticity before installation, 7) Keep systems updated for security patches.",
    topic: "software",
    keywords: ["install", "update", "software", "application", "software center", "admin", "restriction", "patch"]
  },
  {
    id: "doc-006",
    title: "Network Connectivity and Wi-Fi Troubleshooting",
    content: "For Wi-Fi or network connectivity issues: 1) Toggle Wi-Fi off/on, 2) Forget and reconnect to network, 3) Check if other devices can connect to same network, 4) Restart router/modem if home network, 5) Run network troubleshooter in Windows Settings, 6) Check IP configuration with ipconfig /all, 7) Verify DNS settings, 8) Contact network team if issue affects multiple users in same location.",
    topic: "network",
    keywords: ["wifi", "wireless", "internet", "connectivity", "router", "modem", "ip address", "dns", "troubleshooting"]
  },
  {
    id: "doc-007",
    title: "Hardware Warranty and Replacement Process",
    content: "For hardware issues requiring replacement: 1) Document the issue with photos/videos if applicable, 2) Run built-in diagnostics (often accessible via F12 at boot), 3) Check warranty status in asset management system, 4) Submit hardware service ticket through IT portal, 5) Include detailed description and troubleshooting steps already tried, 6) IT will ship replacement or schedule on-site service, 7) Return faulty hardware using provided prepaid label.",
    topic: "hardware",
    keywords: ["hardware", "warranty", "replacement", "repair", "diagnostics", "asset", "ticket", "shipping"]
  },
  {
    id: "doc-008",
    title: "Access Request and Permissions Guide",
    content: "To request access to systems or applications: 1) Determine exactly what access you need (specific systems, applications, data), 2) Get approval from your manager or department head, 3) Submit access request through IT service portal with business justification, 4) Include specific user IDs, group names, or permissions needed, 5) Allow 1-2 business days for processing, 6) You'll receive notification when access is granted, 7) Review access periodically for principle of least privilege.",
    topic: "access_request",
    keywords: ["access", "request", "permission", "permit", "approval", "portal", "system", "application", "data", "groups"]
  },
  {
    id: "doc-009",
    title: "Billing and Subscription Inquiry Process",
    content: "For billing or subscription questions: 1) Check your billing portal at https://billing.company.com for detailed invoices, 2) Review subscription details and usage reports, 3) Common issues include prorated charges, trial conversions, or usage overages, 4) Have your account number and billing period ready when contacting support, 5) Disputes must be filed within 30 days of invoice date, 6) Refunds typically process within 5-10 business days to original payment method.",
    topic: "billing",
    keywords: ["billing", "invoice", "payment", "subscription", "charge", "cost", "refund", "dispute", "account", "portal"]
  },
  {
    id: "doc-010",
    title: "Feature Request and Enhancement Submission",
    content: "To submit feature requests or enhancements: 1) Clearly describe the desired functionality or improvement, 2) Explain the business benefit or problem it solves, 3) Provide use cases or examples of how it would be used, 4) Submit through the product feedback portal or contact your product manager, 5) Include any mockups or workflow descriptions if available, 6) Requests are reviewed quarterly for planning cycles, 7) Not all requests can be implemented due to technical constraints or priorities.",
    topic: "feature_request",
    keywords: ["feature", "request", "enhancement", "improvement", "suggestion", "idea", "feedback", "portal", "benefit", "use case"]
  },
  {
    id: "doc-011",
    title: "Security Incident Reporting Procedure",
    content: "For security concerns or suspected incidents: 1) Do not interact further with suspicious systems or files, 2) Document what you observed (screenshots, timestamps, behavior), 3) Immediately report to security team via email or phone, 4) Isolate affected device if possible (disconnect from network), 5) Follow instructions from security personnel, 6) Preserve evidence for investigation, 7) Security team will conduct forensic analysis and provide guidance on next steps.",
    topic: "security",
    keywords: ["security", "incident", "breach", "hack", "malware", "virus", "phishing", "suspicious", "report", "investigation", "forensic"]
  },
  {
    id: "doc-012",
    title: "General IT Support and How-To Guidance",
    content: "For general questions or how-to guidance: 1) Search the internal knowledge base first, 2) Check if similar questions have been asked in team forums, 3) Be specific about what you're trying to accomplish, 4) Include error messages exactly as they appear, 5) Mention what you've already tried to resolve the issue, 6) Provide screenshots or screen recordings when helpful, 7) IT support aims to respond within 4 business hours for non-urgent issues.",
    topic: "other",
    keywords: ["question", "how", "guide", "help", "support", "assistance", "troubleshooting", "error", "screenshot", "general"]
  }
];

module.exports = {
  mockDocumentation
};