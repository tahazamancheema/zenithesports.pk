"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would connect to an API route (e.g. Resend/SendGrid)
    alert("Message sent! (Mock implementation)");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-20 bg-[var(--color-bg-950)] border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] to-[var(--color-bg-900)]" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Contact Us" }]} 
            className="mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold mb-6 text-white uppercase tracking-tight">
            Get In <span className="text-[var(--color-gold-500)]">Touch</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            Have a question about a tournament? Interested in a partnership? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <h2 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-text-primary)] mb-8">
                Direct Channels
              </h2>
              
              <Card className="bg-[var(--color-bg-800)] border-[var(--color-line-700)]">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-[var(--color-bg-900)] rounded-md">
                    <Mail className="h-6 w-6 text-[var(--color-gold-500)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-1">General Inquiries</h3>
                    <a href={`mailto:${siteConfig.email.contact}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                      {siteConfig.email.contact}
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--color-bg-800)] border-[var(--color-line-700)]">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-[var(--color-bg-900)] rounded-md">
                    <MessageSquare className="h-6 w-6 text-[var(--color-gold-500)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-1">Partnerships & Media</h3>
                    <a href="mailto:partnerships@zenithesports.pk" className="text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                      partnerships@zenithesports.pk
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--color-bg-800)] border-[var(--color-line-700)]">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-[var(--color-bg-900)] rounded-md">
                    <MapPin className="h-6 w-6 text-[var(--color-gold-500)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-1">Headquarters</h3>
                    <p className="text-[var(--color-text-muted)]">
                      Islamabad, Pakistan<br />
                      (Remote First Operations)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-[var(--color-bg-950)] border border-[var(--color-line-800)] rounded-[var(--radius-xl)] p-6 md:p-10">
                <h2 className="text-2xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-text-primary)] mb-8">
                  Send a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="First Name" 
                      name="firstName"
                      placeholder="John" 
                      required 
                    />
                    <Input 
                      label="Last Name" 
                      name="lastName"
                      placeholder="Doe" 
                      required 
                    />
                  </div>
                  
                  <Input 
                    label="Email Address" 
                    name="email"
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                  />
                  
                  <Select
                    label="Subject"
                    name="subject"
                    options={[
                      { label: "General Inquiry", value: "general" },
                      { label: "Tournament Support", value: "support" },
                      { label: "Partnership / Sponsorship", value: "partnership" },
                      { label: "Mark47 Production Services", value: "mark47" },
                      { label: "Media / Press", value: "media" },
                    ]}
                    required
                  />
                  
                  <Textarea 
                    label="Message" 
                    name="message"
                    placeholder="How can we help you?" 
                    rows={6}
                    required 
                  />
                  
                  <Button type="submit" size="lg" className="w-full md:w-auto px-8" iconLeft={<Send className="h-4 w-4" />}>
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
