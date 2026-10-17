"use client";

import { useState } from "react";
import { UploadCloud, Shield, Trophy } from "lucide-react";
import {
  Accordion,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  Drawer,
  EmptyState,
  ErrorState,
  FileUpload,
  Input,
  Modal,
  Pagination,
  ProgressBar,
  RadioGroup,
  Select,
  Skeleton,
  SkeletonText,
  Stepper,
  Switch,
  Tabs,
  Textarea,
  Toast,
  Tooltip,
  toast,
} from "@/components/ui";

export default function ComponentsShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<"left" | "right" | "bottom">("right");

  const showToast = (type: "success" | "error" | "info") => {
    toast({
      type,
      title: "Toast Notification",
      description: "This is a toast notification description.",
    });
  };

  return (
    <div className="container mx-auto p-8 space-y-16 pb-32">
      <div className="space-y-4">
        <h1 className="text-4xl font-[family-name:var(--font-heading)] font-bold text-[var(--color-gold-500)]">
          UI Component Showcase
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-2xl">
          A visual reference for all 30+ bespoke primitives built for the Zenith Esports rebuild.
          Every component respects the brand design system, `prefers-reduced-motion`, and ARIA accessibility guidelines.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Typography & Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-[family-name:var(--font-display)] font-bold">Display Headline</h1>
            <h2 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase">Heading Title</h2>
            <p className="font-[family-name:var(--font-body)] text-[var(--color-text-muted)]">
              This is the body copy font. It's clean, legible, and optimized for reading long-form text on dark backgrounds.
            </p>
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-gold-400)]">
              ZE-2026-0042
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--color-bg-900)] border border-[var(--color-line-800)] rounded-[var(--radius-md)] flex items-center justify-center">
              <span className="text-xs text-[var(--color-text-faint)]">bg-900</span>
            </div>
            <div className="p-4 bg-[var(--color-bg-800)] border border-[var(--color-line-800)] rounded-[var(--radius-md)] flex items-center justify-center">
              <span className="text-xs text-[var(--color-text-faint)]">bg-800</span>
            </div>
            <div className="p-4 bg-[var(--color-bg-700)] border border-[var(--color-line-800)] rounded-[var(--radius-md)] flex items-center justify-center">
              <span className="text-xs text-[var(--color-text-faint)]">bg-700</span>
            </div>
            <div className="p-4 gold-gradient rounded-[var(--radius-md)] flex items-center justify-center">
              <span className="text-xs font-bold text-black">Gold Gradient</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Zone</Button>
          <Button loading>Loading...</Button>
          <Button variant="primary" iconLeft={<Shield className="h-4 w-4" />}>With Icon</Button>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div className="space-y-6">
            <Input label="Email Address" placeholder="player@zenithesports.pk" hint="We will never share your email." />
            <Input label="Username" placeholder="xX_Slayer_Xx" error="This username is already taken." />
            <Select
              label="Select Game"
              placeholder="Choose a game..."
              options={[
                { label: "Valorant", value: "valorant" },
                { label: "Free Fire", value: "freefire" },
                { label: "PUBG Mobile", value: "pubgm" },
              ]}
            />
            <Textarea label="Bio" placeholder="Tell us about yourself..." />
          </div>
          <div className="space-y-6">
            <RadioGroup
              name="team_role"
              label="Team Role"
              options={[
                { label: "Captain", value: "captain" },
                { label: "Player", value: "player" },
                { label: "Coach", value: "coach" },
              ]}
              value="captain"
            />
            <div className="space-y-3">
              <Checkbox label="I accept the Terms and Conditions" />
              <Checkbox label="Subscribe to newsletter (disabled)" disabled />
            </div>
            <div className="space-y-3 pt-4 border-t border-[var(--color-line-800)]">
              <Switch label="Enable Notifications" />
              <Switch label="Dark Mode (always on)" defaultChecked disabled />
            </div>
            <FileUpload label="Upload Proof of Payment" onFileSelect={() => {}} />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Badges & Tags</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Badge>Default</Badge>
          <Badge variant="gold">Premium</Badge>
          <Badge variant="gold" pulse>Live Event</Badge>
          <Badge variant="success">Registered</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Disqualified</Badge>
          <Badge variant="valorant">Valorant</Badge>
          <Badge variant="freefire">Free Fire</Badge>
          <Badge variant="pubgm">PUBG Mobile</Badge>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Data Display</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card hover accentColor="var(--color-valorant)">
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">Zenith Cup: Valorant</h3>
                <Badge variant="valorant">VLR</Badge>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                The premier Valorant tournament in Pakistan. Register your team now to compete for a prize pool of PKR 1,000,000.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm font-medium">Registration Open</span>
              <Button size="sm">Register</Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <div className="flex gap-4">
              <Avatar alt="Taha Zaman" fallback="TZ" />
              <Avatar alt="User" size="lg" />
              <Avatar alt="Admin" size="xl" />
            </div>
            <ProgressBar value={65} showLabel />
            <Breadcrumb
              items={[
                { label: "Tournaments", href: "/tournaments" },
                { label: "Zenith Cup" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Complex Interactive</h2>
        
        <div className="space-y-8">
          <Stepper
            steps={[
              { id: "1", label: "Account" },
              { id: "2", label: "Team" },
              { id: "3", label: "Payment" },
            ]}
            currentStep="2"
            completedSteps={["1"]}
          />

          <Tabs
            items={[
              { id: "t1", label: "Overview", content: <div className="p-4 bg-[var(--color-bg-800)] rounded-md">Overview Content</div> },
              { id: "t2", label: "Rules", content: <div className="p-4 bg-[var(--color-bg-800)] rounded-md">Rules Content</div> },
              { id: "t3", label: "Bracket", content: <div className="p-4 bg-[var(--color-bg-800)] rounded-md">Bracket Content</div> },
            ]}
          />

          <Accordion
            items={[
              { id: "1", title: "What is the prize pool?", content: "The total prize pool is PKR 500,000." },
              { id: "2", title: "How do I register?", content: "Click the register button and fill out the form." },
            ]}
          />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Overlays & Alerts</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          
          <Button variant="secondary" onClick={() => { setDrawerSide("right"); setDrawerOpen(true); }}>
            Right Drawer
          </Button>
          <Button variant="secondary" onClick={() => { setDrawerSide("left"); setDrawerOpen(true); }}>
            Left Drawer
          </Button>
          <Button variant="secondary" onClick={() => { setDrawerSide("bottom"); setDrawerOpen(true); }}>
            Bottom Drawer
          </Button>

          <Button variant="ghost" onClick={() => showToast("success")}>Success Toast</Button>
          <Button variant="ghost" onClick={() => showToast("error")}>Error Toast</Button>

          <Tooltip content="This is a tooltip">
            <div className="px-4 py-2 bg-[var(--color-bg-800)] rounded-md cursor-help border border-[var(--color-line-800)]">
              Hover me
            </div>
          </Tooltip>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold border-b border-[var(--color-line-800)] pb-4">Empty & Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border border-[var(--color-line-800)] rounded-[var(--radius-lg)] bg-[var(--color-bg-800)]">
            <SkeletonText lines={4} />
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="border border-[var(--color-line-800)] rounded-[var(--radius-lg)]">
            <EmptyState
              icon={Trophy}
              title="No tournaments found"
              description="Check back later or adjust your filters."
              action={{ label: "View all", onClick: () => {} }}
            />
          </div>
        </div>
      </section>

      {/* Modals & Drawers */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Registration"
        description="Are you sure you want to register for this tournament? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
        </div>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side={drawerSide}
        title={`${drawerSide.charAt(0).toUpperCase() + drawerSide.slice(1)} Drawer`}
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">
            This is drawer content. It slides in from the {drawerSide} edge.
          </p>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 bg-[var(--color-bg-900)] rounded-md border border-[var(--color-line-800)]">
              Drawer Item {i + 1}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
