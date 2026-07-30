export type KnowledgeItem = {
  id: string;
  questions: string[];
  keywords: string[];
  answer: string;
};

export const quickQuestions = [
  "Naya project kaise banayein?",
  "Report upload kaise karein?",
  "DSR workflow kya hai?",
  "Password reset kaise hoga?",
];

export const knowledgeBase: KnowledgeItem[] = [
  {
    id: "about",
    questions: ["DSR Punjab portal kya hai?", "What is this website?"],
    keywords: ["website", "portal", "dsr", "about", "kya hai", "purpose"],
    answer: "DSR Punjab Portal, Department of Mines & Geology, Government of Punjab ka platform hai. Is par District Survey Report projects prepare, review, approve aur manage kiye jaate hain.",
  },
  {
    id: "login",
    questions: ["Login kaise karein?", "I cannot log in"],
    keywords: ["login", "sign in", "signin", "account", "password", "username"],
    answer: "Login page par registered email/username aur password enter karein. Agar account invitation se bana hai to invitation email ka registration link pehle complete karein.",
  },
  {
    id: "forgot-password",
    questions: ["Password reset kaise hoga?", "Forgot password"],
    keywords: ["forgot", "reset", "password", "otp", "bhul", "bhool"],
    answer: "Login page par ‘Forgot Password’ select karein, registered email enter karein aur email par aaye OTP ko verify karke naya password set karein.",
  },
  {
    id: "new-project",
    questions: ["Naya project kaise banayein?", "Create project"],
    keywords: ["new", "naya", "create", "project", "banaye", "banana"],
    answer: "Projects section kholen aur ‘Create Project’ select karein. District, report year aur required project details fill karke save karein. Project creation ka option role/permission ke mutabik dikhega.",
  },
  {
    id: "project-status",
    questions: ["Project status kahan dikhega?", "Pending project"],
    keywords: ["project", "status", "pending", "progress", "stage", "kahan"],
    answer: "Dashboard ya Projects register mein project kholen. Project overview par current workflow stage, completion progress aur pending action dikhai dete hain.",
  },
  {
    id: "workflow",
    questions: ["DSR workflow kya hai?", "Report approval process"],
    keywords: ["workflow", "approval", "approve", "review", "submit", "process", "stage"],
    answer: "DSR content district level par prepare hota hai, required sections aur annexures complete kiye jaate hain, phir review/observation stage se guzarta hai. Authorized reviewer ya Head Office final verification aur approval karta hai.",
  },
  {
    id: "chapter-upload",
    questions: ["Chapter upload kaise karein?", "Upload document"],
    keywords: ["chapter", "document", "file", "upload", "pdf", "docx"],
    answer: "Project open karke Chapters section par jaayein, required chapter select karein aur supported document upload karein. Upload se pehle file type aur size instructions check karein.",
  },
  {
    id: "report-upload",
    questions: ["Report upload kaise karein?", "DSR PDF upload"],
    keywords: ["report", "dsr", "upload", "pdf", "file"],
    answer: "Project workspace mein relevant section—Front Matter, Chapters, Plates, Cross Sections ya Annexures—open karein. File select karke upload karein aur successful upload ke baad preview verify karein.",
  },
  {
    id: "annexure",
    questions: ["Annexure kaise fill karein?", "Annexure upload"],
    keywords: ["annexure", "annexures", "table", "data", "excel", "fill"],
    answer: "Project ke Annexures section mein required annexure choose karein. Available form mein data enter karein ya supported template/import option use karein, phir validation ke baad save karein.",
  },
  {
    id: "replenishment",
    questions: ["Replenishment study kya hai?", "Replenishment report"],
    keywords: ["replenishment", "survey", "monsoon", "study", "calculation"],
    answer: "Replenishment Study mein pre/post-monsoon survey details, mineral quantity, bulk density, photographs aur supporting evidence record kiye jaate hain. Project ka Replenishment workspace is data ko prepare aur export karne ke liye hai.",
  },
  {
    id: "model-dsr",
    questions: ["Model DSR kaise banega?", "Generate DSR"],
    keywords: ["model", "generate", "builder", "final", "dsr", "section"],
    answer: "Model DSR workspace mein required sections select aur arrange karein, preview verify karein, phir available generation/download action use karein. Final output se pehle missing content zaroor check karein.",
  },
  {
    id: "reports",
    questions: ["Final report download kaise karein?", "Download PDF"],
    keywords: ["download", "final", "report", "pdf", "export", "print"],
    answer: "Reports ya project Preview section mein report open karein. Content verify karne ke baad Download/Generate PDF option use karein. Final action aapke role aur workflow status par depend kar sakta hai.",
  },
  {
    id: "roles",
    questions: ["Portal roles kya hain?", "DMO role"],
    keywords: ["role", "dmo", "reviewer", "admin", "head office", "permission", "access"],
    answer: "Portal mein role-based access hai. DMO project content prepare karta hai, reviewers observations/review handle karte hain, Head Office verification karta hai aur administrators users, settings aur statewide workflow manage karte hain.",
  },
  {
    id: "notifications",
    questions: ["Notifications kahan milengi?", "Observation received"],
    keywords: ["notification", "alert", "observation", "message", "bell"],
    answer: "Header ke notification/bell option ya Notifications page par workflow updates, review observations aur action alerts milte hain. Notification open karke related project par ja sakte hain.",
  },
  {
    id: "support",
    questions: ["Support se contact kaise karein?", "Technical problem"],
    keywords: ["support", "contact", "help", "problem", "issue", "error", "technical"],
    answer: "Agar portal par technical error aa raha hai to Support page use karein ya coe@sensrs.com par screenshot, project name aur problem ka short description bhejein. Password ya OTP share na karein.",
  },
];

const stopWords = new Set(["hai", "hain", "ka", "ki", "ke", "ko", "me", "mein", "se", "the", "a", "an", "is", "how", "what", "please", "mujhe", "batao", "kya"]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

export function findAnswer(question: string) {
  const queryTokens = tokens(question);
  if (!queryTokens.length) return null;

  const ranked = knowledgeBase
    .map((item) => {
      const keywordTokens = tokens(item.keywords.join(" "));
      const questionTokens = tokens(item.questions.join(" "));
      const score = queryTokens.reduce((total, token) => {
        if (keywordTokens.includes(token)) return total + 3;
        if (questionTokens.includes(token)) return total + 2;
        if (keywordTokens.some((keyword) => keyword.includes(token) || token.includes(keyword))) return total + 1;
        return total;
      }, 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score >= 2 ? ranked[0].item : null;
}
