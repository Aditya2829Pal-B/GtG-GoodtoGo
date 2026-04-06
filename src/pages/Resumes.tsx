import { useState } from "react";
import { Plus, FileText, Link2, Trash2, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Resume {
  id: string;
  name: string;
  uploadedAt: string;
  isDefault: boolean;
  size: string;
}

interface PortfolioLink {
  id: string;
  label: string;
  url: string;
}

const mockResumes: Resume[] = [
  { id: "1", name: "John_Doe_Resume_2026.pdf", uploadedAt: "Mar 25, 2026", isDefault: true, size: "245 KB" },
  { id: "2", name: "John_Doe_Resume_Backend.pdf", uploadedAt: "Mar 20, 2026", isDefault: false, size: "198 KB" },
  { id: "3", name: "John_Doe_CV_Extended.pdf", uploadedAt: "Mar 15, 2026", isDefault: false, size: "312 KB" },
];

const mockLinks: PortfolioLink[] = [
  { id: "1", label: "Portfolio Website", url: "https://johndoe.dev" },
  { id: "2", label: "GitHub", url: "https://github.com/johndoe" },
  { id: "3", label: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
];

const Resumes = () => {
  const [resumes] = useState(mockResumes);
  const [links] = useState(mockLinks);
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resumes & Portfolio</h1>
        <p className="text-muted-foreground mt-1">Manage your application materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Resumes</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              Upload
            </Button>
          </div>

          <div className="space-y-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">{resume.size} · Uploaded {resume.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {resume.isDefault ? (
                      <Star className="w-4 h-4 text-warning fill-warning" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Portfolio Links</h2>

          <div className="space-y-3">
            {links.map((link) => (
              <div key={link.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{link.label}</p>
                    <p className="text-xs text-primary">{link.url}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Link Form */}
          <div className="bg-card rounded-xl p-4 shadow-card border border-border border-dashed space-y-3">
            <Input placeholder="Label (e.g., Dribbble)" value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} />
            <Input placeholder="URL" value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} />
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resumes;
