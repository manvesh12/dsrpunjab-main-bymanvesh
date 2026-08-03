export type Language = "en" | "pa";

type LocalizedText = Record<Language, string>;

export type KnowledgeItem = {
  id: string;
  questions: Record<Language, string[]>;
  keywords: string[];
  answers: LocalizedText;
};

export const quickQuestions: Record<Language, string[]> = {
  en: ["How do I create a new project?", "How do I upload a report?", "Explain the DSR workflow", "How do I reset my password?"],
  pa: ["ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਕਿਵੇਂ ਬਣਾਵਾਂ?", "ਰਿਪੋਰਟ ਕਿਵੇਂ ਅੱਪਲੋਡ ਕਰਾਂ?", "DSR ਵਰਕਫਲੋ ਸਮਝਾਓ", "ਪਾਸਵਰਡ ਕਿਵੇਂ ਰੀਸੈੱਟ ਕਰਾਂ?"],
};

export const knowledgeBase: KnowledgeItem[] = [
  {
    id: "about",
    questions: { en: ["What is the DSR Punjab portal?", "What can I do here?"], pa: ["DSR ਪੰਜਾਬ ਪੋਰਟਲ ਕੀ ਹੈ?", "ਮੈਂ ਇੱਥੇ ਕੀ ਕਰ ਸਕਦਾ ਹਾਂ?"] },
    keywords: ["website", "portal", "dsr", "about", "purpose", "ਪੋਰਟਲ", "ਕੀ", "ਹੈ"],
    answers: {
      en: "The DSR Punjab Portal is the Department of Mines & Geology, Government of Punjab platform for preparing, reviewing, approving and managing District Survey Reports.\n\nYou can create projects, complete DSR sections, upload evidence, manage annexures, track reviews and generate final reports.",
      pa: "DSR ਪੰਜਾਬ ਪੋਰਟਲ, ਖਾਣਾਂ ਅਤੇ ਭੂ-ਵਿਗਿਆਨ ਵਿਭਾਗ, ਪੰਜਾਬ ਸਰਕਾਰ ਦਾ ਪਲੇਟਫਾਰਮ ਹੈ। ਇਸ ਉੱਤੇ ਜ਼ਿਲ੍ਹਾ ਸਰਵੇਖਣ ਰਿਪੋਰਟਾਂ ਤਿਆਰ, ਸਮੀਖਿਆ, ਮਨਜ਼ੂਰ ਅਤੇ ਪ੍ਰਬੰਧਿਤ ਕੀਤੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।\n\nਤੁਸੀਂ ਪ੍ਰੋਜੈਕਟ ਬਣਾ ਸਕਦੇ ਹੋ, DSR ਭਾਗ ਪੂਰੇ ਕਰ ਸਕਦੇ ਹੋ, ਸਬੂਤ ਅੱਪਲੋਡ ਕਰ ਸਕਦੇ ਹੋ, ਅਨੁਸੂਚੀਆਂ ਸੰਭਾਲ ਸਕਦੇ ਹੋ ਅਤੇ ਅੰਤਿਮ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰ ਸਕਦੇ ਹੋ।",
    },
  },
  {
    id: "login",
    questions: { en: ["How do I log in?", "I cannot log in"], pa: ["ਲੌਗ ਇਨ ਕਿਵੇਂ ਕਰਾਂ?", "ਮੈਂ ਲੌਗ ਇਨ ਨਹੀਂ ਕਰ ਸਕਦਾ"] },
    keywords: ["login", "sign", "account", "username", "ਲੌਗ", "ਖਾਤਾ"],
    answers: {
      en: "To sign in:\n\n1. Open the Login page.\n2. Enter your registered email or username.\n3. Enter your password and select Sign in.\n4. If your account was invited, complete registration from the invitation email first.\n\nIf it still fails, use Forgot Password or contact support.",
      pa: "ਲੌਗ ਇਨ ਕਰਨ ਲਈ:\n\n1. ਲੌਗ ਇਨ ਪੰਨਾ ਖੋਲ੍ਹੋ।\n2. ਆਪਣੀ ਰਜਿਸਟਰਡ ਈਮੇਲ ਜਾਂ ਯੂਜ਼ਰਨੇਮ ਦਰਜ ਕਰੋ।\n3. ਪਾਸਵਰਡ ਦਰਜ ਕਰਕੇ ‘ਲੌਗ ਇਨ’ ਚੁਣੋ।\n4. ਜੇ ਖਾਤਾ ਸੱਦੇ ਰਾਹੀਂ ਬਣਿਆ ਹੈ, ਪਹਿਲਾਂ ਸੱਦੇ ਵਾਲੀ ਈਮੇਲ ਤੋਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ।\n\nਫਿਰ ਵੀ ਸਮੱਸਿਆ ਆਵੇ ਤਾਂ ‘ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ’ ਵਰਤੋ ਜਾਂ ਸਹਾਇਤਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    },
  },
  {
    id: "forgot-password",
    questions: { en: ["How do I reset my password?", "I forgot my password"], pa: ["ਪਾਸਵਰਡ ਕਿਵੇਂ ਰੀਸੈੱਟ ਕਰਾਂ?", "ਮੈਂ ਪਾਸਵਰਡ ਭੁੱਲ ਗਿਆ ਹਾਂ"] },
    keywords: ["forgot", "reset", "password", "otp", "ਪਾਸਵਰਡ", "ਰੀਸੈੱਟ", "ਭੁੱਲ"],
    answers: {
      en: "To reset your password:\n\n1. Select Forgot Password on the Login page.\n2. Enter your registered email address.\n3. Check your email for the OTP.\n4. Enter the OTP and create a new password.\n5. Return to Login and sign in with the new password.\n\nNever share your password or OTP with anyone.",
      pa: "ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰਨ ਲਈ:\n\n1. ਲੌਗ ਇਨ ਪੰਨੇ ਉੱਤੇ ‘ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ’ ਚੁਣੋ।\n2. ਆਪਣੀ ਰਜਿਸਟਰਡ ਈਮੇਲ ਦਰਜ ਕਰੋ।\n3. ਈਮੇਲ ਉੱਤੇ ਆਇਆ OTP ਵੇਖੋ।\n4. OTP ਦਰਜ ਕਰਕੇ ਨਵਾਂ ਪਾਸਵਰਡ ਬਣਾਓ।\n5. ਲੌਗ ਇਨ ਪੰਨੇ ਉੱਤੇ ਵਾਪਸ ਜਾ ਕੇ ਨਵੇਂ ਪਾਸਵਰਡ ਨਾਲ ਲੌਗ ਇਨ ਕਰੋ।\n\nਆਪਣਾ ਪਾਸਵਰਡ ਜਾਂ OTP ਕਿਸੇ ਨਾਲ ਸਾਂਝਾ ਨਾ ਕਰੋ।",
    },
  },
  {
    id: "new-project",
    questions: { en: ["How do I create a new project?", "Create a project"], pa: ["ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਕਿਵੇਂ ਬਣਾਵਾਂ?", "ਪ੍ਰੋਜੈਕਟ ਬਣਾਓ"] },
    keywords: ["new", "create", "project", "ਨਵਾਂ", "ਪ੍ਰੋਜੈਕਟ", "ਬਣਾਵਾਂ", "ਬਣਾਓ"],
    answers: {
      en: "To create a project:\n\n1. Open Projects from the main menu.\n2. Select Create Project.\n3. Choose the district and report year.\n4. Complete the required project details.\n5. Review the information and select Save.\n6. Open the saved project to start completing its DSR sections.\n\nThe Create Project button only appears for roles with permission.",
      pa: "ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਬਣਾਉਣ ਲਈ:\n\n1. ਮੁੱਖ ਮੀਨੂ ਤੋਂ ‘ਪ੍ਰੋਜੈਕਟ’ ਖੋਲ੍ਹੋ।\n2. ‘ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਬਣਾਓ’ ਚੁਣੋ।\n3. ਜ਼ਿਲ੍ਹਾ ਅਤੇ ਰਿਪੋਰਟ ਸਾਲ ਚੁਣੋ।\n4. ਲੋੜੀਂਦੀ ਪ੍ਰੋਜੈਕਟ ਜਾਣਕਾਰੀ ਭਰੋ।\n5. ਜਾਣਕਾਰੀ ਦੀ ਜਾਂਚ ਕਰਕੇ ‘ਸੇਵ’ ਚੁਣੋ।\n6. ਸੇਵ ਕੀਤਾ ਪ੍ਰੋਜੈਕਟ ਖੋਲ੍ਹ ਕੇ DSR ਦੇ ਭਾਗ ਪੂਰੇ ਕਰੋ।\n\nਇਹ ਬਟਨ ਸਿਰਫ਼ ਅਧਿਕਾਰ ਵਾਲੇ ਉਪਭੋਗਤਾਵਾਂ ਨੂੰ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ।",
    },
  },
  {
    id: "project-status",
    questions: { en: ["Where can I see project status?", "What is pending?"], pa: ["ਪ੍ਰੋਜੈਕਟ ਦੀ ਸਥਿਤੀ ਕਿੱਥੇ ਵੇਖਾਂ?", "ਕੀ ਬਾਕੀ ਹੈ?"] },
    keywords: ["project", "status", "pending", "progress", "stage", "ਸਥਿਤੀ", "ਬਾਕੀ", "ਪ੍ਰਗਤੀ"],
    answers: {
      en: "To check progress:\n\n1. Open Dashboard or Projects.\n2. Select the required project.\n3. View the Project Overview.\n4. Check the current workflow stage, completion percentage and pending action.\n5. Open any incomplete section to continue the work.",
      pa: "ਪ੍ਰਗਤੀ ਵੇਖਣ ਲਈ:\n\n1. ‘ਡੈਸ਼ਬੋਰਡ’ ਜਾਂ ‘ਪ੍ਰੋਜੈਕਟ’ ਖੋਲ੍ਹੋ।\n2. ਲੋੜੀਂਦਾ ਪ੍ਰੋਜੈਕਟ ਚੁਣੋ।\n3. ‘ਪ੍ਰੋਜੈਕਟ ਸੰਖੇਪ’ ਵੇਖੋ।\n4. ਮੌਜੂਦਾ ਵਰਕਫਲੋ ਪੜਾਅ, ਪੂਰਨਤਾ ਪ੍ਰਤੀਸ਼ਤ ਅਤੇ ਬਾਕੀ ਕਾਰਵਾਈ ਵੇਖੋ।\n5. ਕੰਮ ਜਾਰੀ ਰੱਖਣ ਲਈ ਅਧੂਰਾ ਭਾਗ ਖੋਲ੍ਹੋ।",
    },
  },
  {
    id: "workflow",
    questions: { en: ["Explain the DSR workflow", "What is the approval process?"], pa: ["DSR ਵਰਕਫਲੋ ਸਮਝਾਓ", "ਮਨਜ਼ੂਰੀ ਦੀ ਪ੍ਰਕਿਰਿਆ ਕੀ ਹੈ?"] },
    keywords: ["workflow", "approval", "approve", "review", "submit", "process", "ਵਰਕਫਲੋ", "ਮਨਜ਼ੂਰੀ", "ਸਮੀਖਿਆ"],
    answers: {
      en: "The usual DSR workflow is:\n\n1. District-level staff create the project.\n2. Required chapters, tables, maps and annexures are completed.\n3. The report is validated and submitted for review.\n4. Reviewers record observations or return it for correction.\n5. The district team resolves observations and resubmits.\n6. The authorized reviewer or Head Office performs final verification and approval.\n7. The approved report is generated or downloaded.\n\nExact actions depend on your role and the project stage.",
      pa: "ਆਮ DSR ਵਰਕਫਲੋ ਇਹ ਹੈ:\n\n1. ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ ਦਾ ਅਧਿਕਾਰੀ ਪ੍ਰੋਜੈਕਟ ਬਣਾਉਂਦਾ ਹੈ।\n2. ਲੋੜੀਂਦੇ ਅਧਿਆਇ, ਸਾਰਣੀਆਂ, ਨਕਸ਼ੇ ਅਤੇ ਅਨੁਸੂਚੀਆਂ ਪੂਰੀਆਂ ਕੀਤੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।\n3. ਰਿਪੋਰਟ ਦੀ ਜਾਂਚ ਕਰਕੇ ਸਮੀਖਿਆ ਲਈ ਭੇਜੀ ਜਾਂਦੀ ਹੈ।\n4. ਸਮੀਖਿਅਕ ਟਿੱਪਣੀਆਂ ਦਰਜ ਕਰਦਾ ਹੈ ਜਾਂ ਸੁਧਾਰ ਲਈ ਵਾਪਸ ਭੇਜਦਾ ਹੈ।\n5. ਜ਼ਿਲ੍ਹਾ ਟੀਮ ਟਿੱਪਣੀਆਂ ਹੱਲ ਕਰਕੇ ਮੁੜ ਭੇਜਦੀ ਹੈ।\n6. ਅਧਿਕਾਰਤ ਸਮੀਖਿਅਕ ਜਾਂ ਮੁੱਖ ਦਫ਼ਤਰ ਅੰਤਿਮ ਜਾਂਚ ਅਤੇ ਮਨਜ਼ੂਰੀ ਦਿੰਦਾ ਹੈ।\n7. ਮਨਜ਼ੂਰ ਰਿਪੋਰਟ ਤਿਆਰ ਜਾਂ ਡਾਊਨਲੋਡ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।\n\nਸਹੀ ਕਾਰਵਾਈ ਤੁਹਾਡੀ ਭੂਮਿਕਾ ਅਤੇ ਪ੍ਰੋਜੈਕਟ ਦੇ ਪੜਾਅ ਉੱਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ।",
    },
  },
  {
    id: "upload",
    questions: { en: ["How do I upload a report?", "Upload a chapter or PDF"], pa: ["ਰਿਪੋਰਟ ਕਿਵੇਂ ਅੱਪਲੋਡ ਕਰਾਂ?", "ਅਧਿਆਇ ਜਾਂ PDF ਅੱਪਲੋਡ ਕਰੋ"] },
    keywords: ["chapter", "document", "file", "upload", "pdf", "report", "ਅੱਪਲੋਡ", "ਰਿਪੋਰਟ", "ਫਾਈਲ", "ਅਧਿਆਇ"],
    answers: {
      en: "To upload report content:\n\n1. Open the required project.\n2. Choose Front Matter, Chapters, Plates, Cross Sections or Annexures.\n3. Open the relevant section.\n4. Select Upload and choose the supported file.\n5. Wait for the success confirmation.\n6. Preview the uploaded content and verify it before continuing.\n\nCheck the displayed file type and size limits before uploading.",
      pa: "ਰਿਪੋਰਟ ਸਮੱਗਰੀ ਅੱਪਲੋਡ ਕਰਨ ਲਈ:\n\n1. ਲੋੜੀਂਦਾ ਪ੍ਰੋਜੈਕਟ ਖੋਲ੍ਹੋ।\n2. ‘ਮੁੱਢਲਾ ਭਾਗ’, ‘ਅਧਿਆਇ’, ‘ਪਲੇਟਾਂ’, ‘ਕਰਾਸ ਸੈਕਸ਼ਨ’ ਜਾਂ ‘ਅਨੁਸੂਚੀਆਂ’ ਚੁਣੋ।\n3. ਸੰਬੰਧਿਤ ਭਾਗ ਖੋਲ੍ਹੋ।\n4. ‘ਅੱਪਲੋਡ’ ਚੁਣ ਕੇ ਸਹੀ ਫਾਈਲ ਲਗਾਓ।\n5. ਸਫਲਤਾ ਸੁਨੇਹੇ ਦੀ ਉਡੀਕ ਕਰੋ।\n6. ਅੱਪਲੋਡ ਕੀਤੀ ਸਮੱਗਰੀ ਦੀ ਝਲਕ ਵੇਖ ਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।\n\nਅੱਪਲੋਡ ਤੋਂ ਪਹਿਲਾਂ ਫਾਈਲ ਦੀ ਕਿਸਮ ਅਤੇ ਆਕਾਰ ਦੀ ਸੀਮਾ ਵੇਖੋ।",
    },
  },
  {
    id: "annexure",
    questions: { en: ["How do I complete an annexure?", "Import annexure data"], pa: ["ਅਨੁਸੂਚੀ ਕਿਵੇਂ ਭਰਾਂ?", "ਅਨੁਸੂਚੀ ਡਾਟਾ ਇੰਪੋਰਟ ਕਰੋ"] },
    keywords: ["annexure", "table", "data", "excel", "import", "ਅਨੁਸੂਚੀ", "ਡਾਟਾ", "ਐਕਸਲ"],
    answers: {
      en: "To complete an annexure:\n\n1. Open the project and select Annexures.\n2. Choose the required annexure.\n3. Enter data in the form, or download and complete the available template.\n4. Import the completed file when that option is available.\n5. Correct any validation errors.\n6. Save and preview the annexure.",
      pa: "ਅਨੁਸੂਚੀ ਪੂਰੀ ਕਰਨ ਲਈ:\n\n1. ਪ੍ਰੋਜੈਕਟ ਖੋਲ੍ਹ ਕੇ ‘ਅਨੁਸੂਚੀਆਂ’ ਚੁਣੋ।\n2. ਲੋੜੀਂਦੀ ਅਨੁਸੂਚੀ ਚੁਣੋ।\n3. ਫਾਰਮ ਵਿੱਚ ਡਾਟਾ ਭਰੋ ਜਾਂ ਉਪਲਬਧ ਨਮੂਨਾ ਡਾਊਨਲੋਡ ਕਰਕੇ ਪੂਰਾ ਕਰੋ।\n4. ਵਿਕਲਪ ਮਿਲਣ ਉੱਤੇ ਪੂਰੀ ਕੀਤੀ ਫਾਈਲ ਇੰਪੋਰਟ ਕਰੋ।\n5. ਜਾਂਚ ਦੌਰਾਨ ਆਈਆਂ ਗਲਤੀਆਂ ਠੀਕ ਕਰੋ।\n6. ਅਨੁਸੂਚੀ ਸੇਵ ਕਰਕੇ ਝਲਕ ਵੇਖੋ।",
    },
  },
  {
    id: "replenishment",
    questions: { en: ["What is a replenishment study?", "Create a replenishment report"], pa: ["ਪੁਨਰਭਰਣ ਅਧਿਐਨ ਕੀ ਹੈ?", "ਪੁਨਰਭਰਣ ਰਿਪੋਰਟ ਬਣਾਓ"] },
    keywords: ["replenishment", "survey", "monsoon", "study", "calculation", "ਪੁਨਰਭਰਣ", "ਸਰਵੇਖਣ", "ਮਾਨਸੂਨ"],
    answers: {
      en: "A Replenishment Study records pre- and post-monsoon survey details, mineral quantities, bulk density, photographs and supporting evidence.\n\nTo begin, open the project’s Replenishment workspace, complete the study identity, add survey and calculation data, attach evidence, preview every section and then generate the report.",
      pa: "ਪੁਨਰਭਰਣ ਅਧਿਐਨ ਵਿੱਚ ਮਾਨਸੂਨ ਤੋਂ ਪਹਿਲਾਂ ਅਤੇ ਬਾਅਦ ਦੇ ਸਰਵੇਖਣ, ਖਣਿਜ ਮਾਤਰਾ, ਬਲਕ ਡੈਨਸਿਟੀ, ਤਸਵੀਰਾਂ ਅਤੇ ਸਹਾਇਕ ਸਬੂਤ ਦਰਜ ਕੀਤੇ ਜਾਂਦੇ ਹਨ।\n\nਸ਼ੁਰੂ ਕਰਨ ਲਈ ਪ੍ਰੋਜੈਕਟ ਦਾ ‘ਪੁਨਰਭਰਣ’ ਵਰਕਸਪੇਸ ਖੋਲ੍ਹੋ, ਅਧਿਐਨ ਜਾਣਕਾਰੀ ਭਰੋ, ਸਰਵੇਖਣ ਅਤੇ ਗਣਨਾ ਡਾਟਾ ਜੋੜੋ, ਸਬੂਤ ਲਗਾਓ, ਹਰ ਭਾਗ ਦੀ ਝਲਕ ਵੇਖੋ ਅਤੇ ਫਿਰ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰੋ।",
    },
  },
  {
    id: "download",
    questions: { en: ["How do I download the final report?", "Generate a PDF"], pa: ["ਅੰਤਿਮ ਰਿਪੋਰਟ ਕਿਵੇਂ ਡਾਊਨਲੋਡ ਕਰਾਂ?", "PDF ਕਿਵੇਂ ਬਣਾਵਾਂ?"] },
    keywords: ["download", "final", "generate", "pdf", "export", "ਡਾਊਨਲੋਡ", "ਅੰਤਿਮ", "ਤਿਆਰ"],
    answers: {
      en: "To generate the final report:\n\n1. Open the project’s Preview or Reports section.\n2. Check for missing sections and validation warnings.\n3. Review the complete preview.\n4. Select Generate PDF or Download.\n5. Open the downloaded file and confirm its pages and attachments.\n\nAvailability depends on your role and the project’s workflow status.",
      pa: "ਅੰਤਿਮ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰਨ ਲਈ:\n\n1. ਪ੍ਰੋਜੈਕਟ ਦਾ ‘ਝਲਕ’ ਜਾਂ ‘ਰਿਪੋਰਟਾਂ’ ਭਾਗ ਖੋਲ੍ਹੋ।\n2. ਅਧੂਰੇ ਭਾਗ ਅਤੇ ਜਾਂਚ ਚੇਤਾਵਨੀਆਂ ਵੇਖੋ।\n3. ਪੂਰੀ ਰਿਪੋਰਟ ਦੀ ਝਲਕ ਦੀ ਜਾਂਚ ਕਰੋ।\n4. ‘PDF ਤਿਆਰ ਕਰੋ’ ਜਾਂ ‘ਡਾਊਨਲੋਡ’ ਚੁਣੋ।\n5. ਡਾਊਨਲੋਡ ਕੀਤੀ ਫਾਈਲ ਖੋਲ੍ਹ ਕੇ ਪੰਨਿਆਂ ਅਤੇ ਨੱਥੀਆਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।\n\nਇਹ ਵਿਕਲਪ ਤੁਹਾਡੀ ਭੂਮਿਕਾ ਅਤੇ ਪ੍ਰੋਜੈਕਟ ਦੀ ਸਥਿਤੀ ਉੱਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।",
    },
  },
  {
    id: "roles",
    questions: { en: ["What are the portal roles?", "What can a DMO do?"], pa: ["ਪੋਰਟਲ ਦੀਆਂ ਭੂਮਿਕਾਵਾਂ ਕੀ ਹਨ?", "DMO ਕੀ ਕਰ ਸਕਦਾ ਹੈ?"] },
    keywords: ["role", "dmo", "reviewer", "admin", "head", "permission", "ਭੂਮਿਕਾ", "ਅਧਿਕਾਰ", "ਸਮੀਖਿਅਕ"],
    answers: {
      en: "Portal access is role-based:\n\n• DMO and district users prepare project content.\n• Reviewers examine reports and record observations.\n• Head Office users perform verification and approval actions.\n• Administrators manage users, settings and statewide workflow.\n\nThe menus and buttons you see are determined by your assigned role.",
      pa: "ਪੋਰਟਲ ਦੀ ਪਹੁੰਚ ਭੂਮਿਕਾ ਅਨੁਸਾਰ ਹੈ:\n\n• DMO ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਉਪਭੋਗਤਾ ਪ੍ਰੋਜੈਕਟ ਸਮੱਗਰੀ ਤਿਆਰ ਕਰਦੇ ਹਨ।\n• ਸਮੀਖਿਅਕ ਰਿਪੋਰਟਾਂ ਦੀ ਜਾਂਚ ਕਰਕੇ ਟਿੱਪਣੀਆਂ ਦਰਜ ਕਰਦੇ ਹਨ।\n• ਮੁੱਖ ਦਫ਼ਤਰ ਦੇ ਉਪਭੋਗਤਾ ਜਾਂਚ ਅਤੇ ਮਨਜ਼ੂਰੀ ਦੀ ਕਾਰਵਾਈ ਕਰਦੇ ਹਨ।\n• ਪ੍ਰਬੰਧਕ ਉਪਭੋਗਤਾ, ਸੈਟਿੰਗਾਂ ਅਤੇ ਸੂਬਾ ਪੱਧਰੀ ਵਰਕਫਲੋ ਸੰਭਾਲਦੇ ਹਨ।\n\nਤੁਹਾਨੂੰ ਦਿਖਣ ਵਾਲੇ ਮੀਨੂ ਅਤੇ ਬਟਨ ਤੁਹਾਡੀ ਨਿਰਧਾਰਤ ਭੂਮਿਕਾ ਅਨੁਸਾਰ ਹੁੰਦੇ ਹਨ।",
    },
  },
  {
    id: "notifications",
    questions: { en: ["Where can I find notifications?", "I received an observation"], pa: ["ਸੂਚਨਾਵਾਂ ਕਿੱਥੇ ਮਿਲਣਗੀਆਂ?", "ਮੈਨੂੰ ਟਿੱਪਣੀ ਮਿਲੀ ਹੈ"] },
    keywords: ["notification", "alert", "observation", "message", "bell", "ਸੂਚਨਾ", "ਟਿੱਪਣੀ", "ਘੰਟੀ"],
    answers: {
      en: "Select the bell in the header or open Notifications. You can view workflow updates, review observations and action alerts there. Open a notification to go to the related project, read the observation, make the required correction and resubmit when ready.",
      pa: "ਹੈਡਰ ਵਿੱਚ ਘੰਟੀ ਚੁਣੋ ਜਾਂ ‘ਸੂਚਨਾਵਾਂ’ ਖੋਲ੍ਹੋ। ਉੱਥੇ ਵਰਕਫਲੋ ਅੱਪਡੇਟ, ਸਮੀਖਿਆ ਟਿੱਪਣੀਆਂ ਅਤੇ ਕਾਰਵਾਈ ਚੇਤਾਵਨੀਆਂ ਮਿਲਦੀਆਂ ਹਨ। ਸੰਬੰਧਿਤ ਪ੍ਰੋਜੈਕਟ ਖੋਲ੍ਹਣ ਲਈ ਸੂਚਨਾ ਚੁਣੋ, ਟਿੱਪਣੀ ਪੜ੍ਹੋ, ਲੋੜੀਂਦਾ ਸੁਧਾਰ ਕਰੋ ਅਤੇ ਤਿਆਰ ਹੋਣ ਉੱਤੇ ਮੁੜ ਭੇਜੋ।",
    },
  },
  {
    id: "support",
    questions: { en: ["How do I contact support?", "I have a technical error"], pa: ["ਸਹਾਇਤਾ ਨਾਲ ਕਿਵੇਂ ਸੰਪਰਕ ਕਰਾਂ?", "ਤਕਨੀਕੀ ਗਲਤੀ ਆ ਰਹੀ ਹੈ"] },
    keywords: ["support", "contact", "help", "problem", "issue", "error", "technical", "ਸਹਾਇਤਾ", "ਸਮੱਸਿਆ", "ਗਲਤੀ"],
    answers: {
      en: "For a technical issue:\n\n1. Note the project name and the page where the issue occurred.\n2. Take a screenshot of the error.\n3. Open the Support page or email coe@sensrs.com.\n4. Include a short description, project name and screenshot.\n\nDo not include your password or OTP.",
      pa: "ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਲਈ:\n\n1. ਪ੍ਰੋਜੈਕਟ ਦਾ ਨਾਮ ਅਤੇ ਸਮੱਸਿਆ ਵਾਲਾ ਪੰਨਾ ਨੋਟ ਕਰੋ।\n2. ਗਲਤੀ ਦਾ ਸਕ੍ਰੀਨਸ਼ਾਟ ਲਓ।\n3. ‘ਸਹਾਇਤਾ’ ਪੰਨਾ ਖੋਲ੍ਹੋ ਜਾਂ coe@sensrs.com ਉੱਤੇ ਈਮੇਲ ਕਰੋ।\n4. ਛੋਟਾ ਵੇਰਵਾ, ਪ੍ਰੋਜੈਕਟ ਦਾ ਨਾਮ ਅਤੇ ਸਕ੍ਰੀਨਸ਼ਾਟ ਸ਼ਾਮਲ ਕਰੋ।\n\nਆਪਣਾ ਪਾਸਵਰਡ ਜਾਂ OTP ਨਾ ਭੇਜੋ।",
    },
  },
];

const stopWords = new Set(["the", "a", "an", "is", "how", "what", "please", "do", "i", "my", "to", "and", "ਦਾ", "ਦੀ", "ਦੇ", "ਨੂੰ", "ਹੈ", "ਹਨ", "ਕੀ", "ਕਿਵੇਂ", "ਮੈਂ"]);

function tokens(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

export function findAnswer(question: string, language: Language) {
  const queryTokens = tokens(question);
  if (!queryTokens.length) return null;

  const ranked = knowledgeBase
    .map((item) => {
      const keywordTokens = tokens(item.keywords.join(" "));
      const questionTokens = tokens([...item.questions.en, ...item.questions.pa].join(" "));
      const score = queryTokens.reduce((total, token) => {
        if (keywordTokens.includes(token)) return total + 3;
        if (questionTokens.includes(token)) return total + 2;
        if (keywordTokens.some((keyword) => keyword.includes(token) || token.includes(keyword))) return total + 1;
        return total;
      }, 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score >= 2 ? { ...ranked[0].item, answer: ranked[0].item.answers[language] } : null;
}
