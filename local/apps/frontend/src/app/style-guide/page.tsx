import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function StyleGuidePage() {
  const swatches = [
    { name: "Primary", var: "--color-primary" },
    { name: "Primary Hover", var: "--color-primary-hover" },
    { name: "Primary Muted", var: "--color-primary-muted" },
    { name: "Accent", var: "--color-accent" },
    { name: "Secondary", var: "--color-secondary" },
    { name: "Muted", var: "--color-muted" },
  ];

  return (
    <PageShell className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">Design System — Style Guide</h1>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Typography</h2>
        <div className="space-y-3">
          <h1>Display H1 — Elegant and Confident</h1>
          <h2>Headline H2 — Clean and Modern</h2>
          <h3>Section H3 — Clear and Helpful</h3>
          <p className="text-muted-foreground">Body text — balanced line-height and legible color contrast.</p>
          <a href="#" className="underline">Links — interactive and accessible</a>
        </div>
      </Card>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-2">
              <div
                className="h-16 rounded-xl border"
                style={{ backgroundColor: `var(${s.var})` }}
              />
              <div className="text-sm text-muted-foreground">{s.name}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Components</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Button variant="primary">Primary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <div className="space-y-3">
            <Input placeholder="Input field" />
            <Select defaultValue={"option-1"}>
              <option value="option-1">Select option</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Usage Notes</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Use large, friendly headings and generous white space.</li>
          <li>Favor subtle shadows and rounded corners to convey premium feel.</li>
          <li>Primary color drives CTAs; keep supporting colors muted.</li>
          <li>Motion is subtle: fade-in-up and hover transitions only.</li>
          <li>Maintain consistent spacing (8px scale) and line-height.</li>
        </ul>
      </Card>
    </PageShell>
  );
}

