"use client";

import { useState, useRef, useEffect } from "react";
import { 
  FileText, Download, Sparkles, Building2, User, DollarSign, Calendar, AlertCircle, Loader2, CheckCircle2, RotateCcw
} from "lucide-react";

interface DocumentsClientProps {
  clients: any[];
  branding?: any;
}

export default function DocumentsClient({ clients, branding }: DocumentsClientProps) {
  // Input fields
  const [clientName, setClientName] = useState("Client Name");
  const [projectName, setProjectName] = useState("Project Name");
  const [dateVal, setDateVal] = useState("22 July 2026");
  const [agencyName, setAgencyName] = useState(branding?.company_name || "The Story Builder");
  
  // Greeting & Body
  const [clientFirstName, setClientFirstName] = useState("there");
  const [greetingBody, setGreetingBody] = useState(`Thank you for choosing ${branding?.company_name || "The Story Builder"}. We build websites and digital experiences that help businesses like yours grow — and this guide is your map for the journey ahead: who you'll be working with, how we communicate, and what each stage of the project looks like.`);

  // Team
  const [teamMarketing, setTeamMarketing] = useState("Heena");
  const [teamCreative, setTeamCreative] = useState("Aditi");
  const [teamDesign, setTeamDesign] = useState("Sathwika");
  const [teamVideo, setTeamVideo] = useState("Umesh");

  // Communication
  const [primaryContact, setPrimaryContact] = useState("Shiva");
  const [email, setEmail] = useState("hello@thestorybuilder.in");
  const [phone, setPhone] = useState("+91 00000 00000");
  const [responseTime, setResponseTime] = useState("Within 24 business hours");

  // Timeline Steps
  const [step1Title, setStep1Title] = useState("Kickoff call");
  const [step1Desc, setStep1Desc] = useState("We align on goals, timelines, and content requirements.");
  const [step2Title, setStep2Title] = useState("Design & build");
  const [step2Desc, setStep2Desc] = useState("Our team designs and develops your project in stages, with check-ins along the way.");
  const [step3Title, setStep3Title] = useState("Review & revisions");
  const [step3Desc, setStep3Desc] = useState("You review the work and share feedback; we refine until it's right.");
  const [step4Title, setStep4Title] = useState("Launch");
  const [step4Desc, setStep4Desc] = useState("We go live, and hand over everything you need to manage it going forward.");

  // Notes
  const [note1, setNote1] = useState("Please share brand assets, logins, and content early — it keeps things on schedule.");
  const [note2, setNote2] = useState("Feedback rounds work best when notes are specific and consolidated in one message.");
  const [note3, setNote3] = useState("Invoices are shared as per the agreed payment schedule in your service agreement.");

  // Closing Signoff
  const [signName, setSignName] = useState("Shiva");
  const [signRole, setSignRole] = useState("Founder, The Story Builder");
  const [closingEmail, setClosingEmail] = useState("hello@thestorybuilder.in");

  // Set today's date automatically
  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setDateVal(today.toLocaleDateString("en-US", options));
  }, []);

  const resetGuide = () => {
    if (!confirm("Reset all fields back to the original placeholder text?")) return;
    setClientName("Client Name");
    setProjectName("Project Name");
    setClientFirstName("there");
    setTeamMarketing("Heena");
    setTeamCreative("Aditi");
    setTeamDesign("Sathwika");
    setTeamVideo("Umesh");
    setPrimaryContact("Shiva");
    setEmail("hello@thestorybuilder.in");
    setPhone("+91 00000 00000");
    setResponseTime("Within 24 business hours");
    setStep1Title("Kickoff call");
    setStep1Desc("We align on goals, timelines, and content requirements.");
    setStep2Title("Design & build");
    setStep2Desc("Our team designs and develops your project in stages, with check-ins along the way.");
    setStep3Title("Review & revisions");
    setStep3Desc("You review the work and share feedback; we refine until it's right.");
    setStep4Title("Launch");
    setStep4Desc("We go live, and hand over everything you need to manage it going forward.");
    setNote1("Please share brand assets, logins, and content early — it keeps things on schedule.");
    setNote2("Feedback rounds work best when notes are specific and consolidated in one message.");
    setNote3("Invoices are shared as per the agreed payment schedule in your service agreement.");
    setSignName("Shiva");
    setSignRole("Founder, The Story Builder");
    setClosingEmail("hello@thestorybuilder.in");
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs mx-auto">
      {/* Interactive Controls Toolbar */}
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl no-print">
        <div className="flex items-center gap-2">
          <FileText className="text-amber-500" size={18} />
          <span className="text-white font-bold">Client Welcome Guide Editor</span>
          <span className="text-neutral-500 text-xxs hidden md:inline">| Double-click/click text inside the sheet below to edit directly</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold px-4 py-2 rounded-lg transition-all cursor-pointer text-xs"
          >
            <Download size={14} />
            Print / Download PDF
          </button>
          <button
            onClick={resetGuide}
            className="flex items-center gap-1 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 px-3 py-2 rounded-lg transition-all cursor-pointer text-xs"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* RENDER SHEET */}
      <div className="sheet bg-[#faf7f1] text-[#171512] shadow-2xl rounded-2xl overflow-hidden border border-[#ddd4c2] font-sans transition-all">
        
        {/* COVER STYLE */}
        <div className="bg-[#26344d] text-[#faf7f1] p-12 relative overflow-hidden">
          <div className="absolute right-[-60px] top-[-60px] w-[260px] h-[260px] border border-white/10 rounded-full" />
          <div className="absolute right-[20px] top-[40px] w-[180px] h-[180px] border border-white/5 rounded-full" />
          
          <div className="text-[#f0e3c8] tracking-[0.18em] uppercase font-bold mb-4 text-[10px]">
            Client Welcome Guide
          </div>
          <h1 className="font-serif font-medium text-4xl md:text-5xl leading-tight max-w-lg mb-4 text-[#faf7f1]">
            Welcome to <span className="italic text-[#f0e3c8] outline-none border-b border-dashed border-[#f0e3c8]/40 hover:bg-[#a8792f]/20 px-1 rounded transition-colors" contentEditable suppressContentEditableWarning onBlur={(e) => setAgencyName(e.currentTarget.textContent || "")}>{agencyName}</span>
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-white/80 max-w-md outline-none border-b border-dashed border-white/20 hover:bg-[#a8792f]/20 px-1 rounded transition-colors" contentEditable suppressContentEditableWarning onBlur={(e) => setGreetingBody(e.currentTarget.textContent || "")}>
            We're glad you're here. This guide walks you through how we work together, who's on your team, and what happens next.
          </p>

          <div className="flex flex-wrap gap-8 mt-10 border-t border-white/10 pt-8">
            <div>
              <label className="block uppercase tracking-wider text-[9px] text-[#f0e3c8] mb-1 font-semibold">Prepared for</label>
              <span className="font-bold text-white outline-none border-b border-dashed border-white/20 hover:bg-[#a8792f]/20 px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setClientName(e.currentTarget.textContent || "")}>{clientName}</span>
            </div>
            <div>
              <label className="block uppercase tracking-wider text-[9px] text-[#f0e3c8] mb-1 font-semibold">Project</label>
              <span className="font-bold text-white outline-none border-b border-dashed border-white/20 hover:bg-[#a8792f]/20 px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setProjectName(e.currentTarget.textContent || "")}>{projectName}</span>
            </div>
            <div>
              <label className="block uppercase tracking-wider text-[9px] text-[#f0e3c8] mb-1 font-semibold">Date</label>
              <span className="font-bold text-white outline-none border-b border-dashed border-white/20 hover:bg-[#a8792f]/20 px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setDateVal(e.currentTarget.textContent || "")}>{dateVal}</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 md:p-12 space-y-10">
          <div>
            <p className="font-serif text-xl md:text-2xl text-[#171512] mb-3">
              Hi <span className="outline-none border-b border-dashed border-[#171512]/20 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setClientFirstName(e.currentTarget.textContent || "")}>{clientFirstName}</span>,
            </p>
            <p className="text-neutral-700 leading-relaxed text-sm max-w-2xl outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setGreetingBody(e.currentTarget.textContent || "")}>
              {greetingBody}
            </p>
          </div>

          {/* CHAPTER 1 */}
          <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 border-t border-[#ddd4c2] pt-8">
            <div className="font-serif italic text-2xl text-[#a8792f] font-semibold">01</div>
            <div>
              <h2 className="font-serif text-lg font-bold mb-4 text-[#171512]">Your Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#f1ece1] border-l-4 border-[#a8792f] p-4">
                  <div className="uppercase text-[9px] tracking-wider text-neutral-500 font-bold mb-1">Marketing</div>
                  <div className="font-serif font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setTeamMarketing(e.currentTarget.textContent || "")}>{teamMarketing}</div>
                </div>
                <div className="bg-[#f1ece1] border-l-4 border-[#a8792f] p-4">
                  <div className="uppercase text-[9px] tracking-wider text-neutral-500 font-bold mb-1">Creative</div>
                  <div className="font-serif font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setTeamCreative(e.currentTarget.textContent || "")}>{teamCreative}</div>
                </div>
                <div className="bg-[#f1ece1] border-l-4 border-[#a8792f] p-4">
                  <div className="uppercase text-[9px] tracking-wider text-neutral-500 font-bold mb-1">Graphic Design</div>
                  <div className="font-serif font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setTeamDesign(e.currentTarget.textContent || "")}>{teamDesign}</div>
                </div>
                <div className="bg-[#f1ece1] border-l-4 border-[#a8792f] p-4">
                  <div className="uppercase text-[9px] tracking-wider text-neutral-500 font-bold mb-1">Video Editing</div>
                  <div className="font-serif font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setTeamVideo(e.currentTarget.textContent || "")}>{teamVideo}</div>
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER 2 */}
          <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 border-t border-[#ddd4c2] pt-8">
            <div className="font-serif italic text-2xl text-[#a8792f] font-semibold">02</div>
            <div>
              <h2 className="font-serif text-lg font-bold mb-4 text-[#171512]">How We'll Communicate</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-dashed border-[#ddd4c2] pb-2">
                  <span className="text-neutral-500 font-medium">Primary contact</span>
                  <span className="font-bold outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setPrimaryContact(e.currentTarget.textContent || "")}>{primaryContact}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-dashed border-[#ddd4c2] pb-2">
                  <span className="text-neutral-500 font-medium">Email</span>
                  <span className="font-bold outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setEmail(e.currentTarget.textContent || "")}>{email}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-dashed border-[#ddd4c2] pb-2">
                  <span className="text-neutral-500 font-medium">Phone / WhatsApp</span>
                  <span className="font-bold outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setPhone(e.currentTarget.textContent || "")}>{phone}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-dashed border-[#ddd4c2] pb-2">
                  <span className="text-neutral-500 font-medium">Response time</span>
                  <span className="font-bold outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setResponseTime(e.currentTarget.textContent || "")}>{responseTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER 3 */}
          <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 border-t border-[#ddd4c2] pt-8">
            <div className="font-serif italic text-2xl text-[#a8792f] font-semibold">03</div>
            <div>
              <h2 className="font-serif text-lg font-bold mb-4 text-[#171512]">What Happens Next</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a8792f] mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setStep1Title(e.currentTarget.textContent || "")}>{step1Title}</div>
                    <div className="text-neutral-600 leading-relaxed outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded mt-1" contentEditable suppressContentEditableWarning onBlur={(e) => setStep1Desc(e.currentTarget.textContent || "")}>{step1Desc}</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a8792f] mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setStep2Title(e.currentTarget.textContent || "")}>{step2Title}</div>
                    <div className="text-neutral-600 leading-relaxed outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded mt-1" contentEditable suppressContentEditableWarning onBlur={(e) => setStep2Desc(e.currentTarget.textContent || "")}>{step2Desc}</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a8792f] mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setStep3Title(e.currentTarget.textContent || "")}>{step3Title}</div>
                    <div className="text-neutral-600 leading-relaxed outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded mt-1" contentEditable suppressContentEditableWarning onBlur={(e) => setStep3Desc(e.currentTarget.textContent || "")}>{step3Desc}</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a8792f] mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setStep4Title(e.currentTarget.textContent || "")}>{step4Title}</div>
                    <div className="text-neutral-600 leading-relaxed outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded mt-1" contentEditable suppressContentEditableWarning onBlur={(e) => setStep4Desc(e.currentTarget.textContent || "")}>{step4Desc}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER 4 */}
          <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 border-t border-[#ddd4c2] pt-8 pb-4">
            <div className="font-serif italic text-2xl text-[#a8792f] font-semibold">04</div>
            <div>
              <h2 className="font-serif text-lg font-bold mb-3 text-[#171512]">Good to Know</h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-700 leading-relaxed">
                <li className="outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setNote1(e.currentTarget.textContent || "")}>{note1}</li>
                <li className="outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setNote2(e.currentTarget.textContent || "")}>{note2}</li>
                <li className="outline-none border-b border-dashed border-neutral-300 hover:bg-[#f0e3c8] px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setNote3(e.currentTarget.textContent || "")}>{note3}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CLOSING STYLE */}
        <div className="bg-[#171512] text-[#faf7f1] p-12 text-center space-y-4">
          <div className="font-serif italic text-2xl text-[#f0e3c8] outline-none border-b border-dashed border-[#faf7f1]/20 hover:bg-[#a8792f]/20 px-1 rounded inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setSignName(e.currentTarget.textContent || "")}>{signName}</div>
          <div className="text-[10px] tracking-wider uppercase text-white/50 outline-none border-b border-dashed border-[#faf7f1]/20 hover:bg-[#a8792f]/20 px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setSignRole(e.currentTarget.textContent || "")}>{signRole}</div>
          <div className="text-xs text-white/70 pt-2 border-t border-white/5">
            Reach us anytime at <span className="font-bold text-white outline-none border-b border-dashed border-[#faf7f1]/20 hover:bg-[#a8792f]/20 px-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setClosingEmail(e.currentTarget.textContent || "")}>{closingEmail}</span>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #white !important;
            color: #000 !important;
          }
          .no-print, .toolbar {
            display: none !important;
          }
          .sheet {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
