import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobflow, type RecruiterContact } from "@/contexts/JobflowContext";
import { Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function RecruiterContactCard({ appId, contacts = [] }: { appId: string, contacts?: RecruiterContact[] }) {
  const c = useJobflow();
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const handleSave = () => {
    if (!name) return toast.error("Name is required");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return toast.error("Invalid email format");
    c.addApplicationContact(appId, {
      name, title, email, linkedin, status: "Not contacted"
    });
    setAdding(false);
    setName(""); setTitle(""); setEmail(""); setLinkedin("");
    toast.success("Contact added");
  };

  const copyTemplate = (type: number, contactName: string) => {
    let t = "";
    if (type === 1) t = `Hi ${contactName.split(" ")[0]},\n\nI saw the opening for the role on your team and would love to connect. I recently completed a similar project and believe my background in this space could be a great fit.\n\nBest,\n[Your Name]`;
    if (type === 2) t = `Hi ${contactName.split(" ")[0]},\n\nThank you for taking the time to speak with me today. I enjoyed learning more about the role and team. I'm very excited about the opportunity to contribute to your upcoming projects.\n\nBest,\n[Your Name]`;
    if (type === 3) t = `Hi ${contactName.split(" ")[0]},\n\nI hope you're having a great week. I wanted to quickly check in on the status of my application for the role. Please let me know if you need any additional information from my end.\n\nBest,\n[Your Name]`;
    
    navigator.clipboard.writeText(t);
    setCopied(contactName + type);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Template copied to clipboard");
  };

  return (
    <div style={{ marginTop: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <small style={{ color: "var(--muted)", fontWeight: "bold" }}>Recruiter & Contacts</small>
        {!adding && (
          <button className="text-link" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add Contact
          </button>
        )}
      </div>

      {adding && (
        <div style={{ border: "1px solid var(--rule)", padding: "10px", borderRadius: "8px", marginBottom: "15px", display: "grid", gap: "10px" }}>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. Hiring Manager)" />
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" className="button button--lime" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {contacts.map(contact => (
          <div key={contact.id} style={{ border: "1px solid var(--rule)", padding: "10px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>{contact.name}</b>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select 
                  style={{ fontSize: "11px", padding: "2px", borderRadius: "4px" }}
                  value={contact.status} 
                  onChange={e => c.updateApplicationContact(appId, contact.id, { status: e.target.value as any })}
                >
                  <option>Not contacted</option>
                  <option>Messaged</option>
                  <option>Replied</option>
                  <option>Coffee chat scheduled</option>
                </select>
                <button className="icon-button" style={{ color: "var(--muted)", padding: 0 }} onClick={() => {c.deleteApplicationContact(appId, contact.id); toast.success("Contact deleted")}}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{contact.title}</div>
            
            <div style={{ marginTop: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
              <button className="mini-button" onClick={() => copyTemplate(1, contact.name)}>{copied === contact.name + 1 ? <Check size={12} /> : <Copy size={12}/>} Cold Note</button>
              <button className="mini-button" onClick={() => copyTemplate(2, contact.name)}>{copied === contact.name + 2 ? <Check size={12} /> : <Copy size={12}/>} Thank You</button>
              <button className="mini-button" onClick={() => copyTemplate(3, contact.name)}>{copied === contact.name + 3 ? <Check size={12} /> : <Copy size={12}/>} Check-in</button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && !adding && (
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>No contacts tracked yet.</div>
        )}
      </div>
    </div>
  );
}
