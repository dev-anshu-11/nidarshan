import { Route, Switch, Redirect } from "wouter";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { Upload, Processing, Dashboard, Entities, Timeline, Report } from "./screens";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08090f] text-[#f1f3ff]">
      <Sidebar />
      <TopBar />
      <main className="pl-14 pt-14 h-screen">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/upload" component={Upload} />
        <Route path="/processing" component={Processing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/entities" component={Entities} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/report" component={Report} />
        
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        
        <Route>
          <div className="p-8">
            <h1 className="font-display text-xl">404 Not Found</h1>
          </div>
        </Route>
      </Switch>
    </AppLayout>
  );
}
