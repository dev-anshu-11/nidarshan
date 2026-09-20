import { useLocation } from "wouter";
import { ShieldAlert } from "lucide-react";

export function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, perform auth here.
    setLocation("/upload");
  };

  return (
    <div className="min-h-screen bg-[#08090f] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-[#0f1018] border border-[#1c1e2e] rounded-xl shadow-2xl p-8 relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#7c3aed]" />
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[#1a103a] rounded-full border border-[#3b1f80] flex items-center justify-center mb-4">
            <ShieldAlert className="text-[#7c3aed]" size={24} />
          </div>
          <h1 className="font-display text-[24px] font-bold text-[#f1f3ff] tracking-wide">NIDARSHAN</h1>
          <p className="font-sans text-[13px] text-[#8891aa] mt-1 text-center">
            Forensic Correlation Engine
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-display text-[11px] font-medium text-[#8891aa] uppercase tracking-wider">
              Investigator ID / Email
            </label>
            <input 
              type="text" 
              placeholder="Enter your ID"
              className="w-full h-10 px-4 bg-[#141622] border border-[#2a2d42] rounded-md font-sans text-[14px] text-[#f1f3ff] placeholder:text-[#4a5068] focus:outline-none focus:border-[#7c3aed] transition-colors"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-display text-[11px] font-medium text-[#8891aa] uppercase tracking-wider">
                Passcode
              </label>
            </div>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full h-10 px-4 bg-[#141622] border border-[#2a2d42] rounded-md font-sans text-[14px] text-[#f1f3ff] placeholder:text-[#4a5068] focus:outline-none focus:border-[#7c3aed] transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full h-[48px] mt-4 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-md font-display text-[15px] font-semibold text-white transition-colors"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1c1e2e] text-center">
          <p className="font-sans text-[11px] text-[#4a5068]">
            Unauthorized access to this system is strictly prohibited and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
