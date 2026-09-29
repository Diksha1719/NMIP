'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  GitCompare,
  Database,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Network,
  Sparkles,
  BarChart3,
  Server,
  Lock,
  ArrowUpRight,
  ChevronRight,
  Check,
  Building2,
} from 'lucide-react';

export default function MasterLandingPage() {
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 800], [0, 45]);

  return (
    <div style={{ backgroundColor: '#F4EBDD', color: '#2B211B', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. TOP GOVERNMENT STRIP */}
      <div className="gov-top-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#A65F3B' }}></span>
          <span>Government of India | Ministry of Petroleum & Natural Gas</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', color: '#EADCC8', opacity: 0.9 }}>
          <span style={{ cursor: 'pointer' }}>English</span>
          <span>|</span>
          <span style={{ cursor: 'pointer' }}>हिंदी</span>
          <span>|</span>
          <span style={{ cursor: 'pointer' }}>Accessibility</span>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <header className="cpcl-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="cpcl-emblem">NMIP</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', color: '#2B211B', letterSpacing: '0.5px', lineHeight: 1.1 }}>
              NMIP
            </div>
            <div style={{ fontSize: '10px', color: '#6F6258', letterSpacing: '0.4px', fontWeight: 600 }}>
              National Material Intelligence Platform
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Overview', 'Platform', 'Intelligence', 'Governance', 'Impact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#2B211B',
                opacity: 0.85,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            >
              {item}
            </a>
          ))}
        </nav>

        <Link href="/login" className="cpcl-btn-primary" style={{ padding: '10px 22px', fontSize: '13px' }}>
          Access Platform
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* 3. HERO SECTION */}
      <section className="cpcl-hero" id="overview">
        {/* Heritage Background Illustration */}
        <motion.div
          className="cpcl-hero-bg"
          style={{ y: heroParallaxY }}
        />
        <div className="cpcl-hero-overlay" />

        <div className="cpcl-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: '#A65F3B', marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ width: '18px', height: '2px', backgroundColor: '#A65F3B' }}></span>
              NATIONAL MATERIAL INTELLIGENCE PLATFORM
            </div>

            <h1 className="cpcl-heading-hero" style={{ color: '#2B211B' }}>
              One Nation.<br />
              <span style={{ color: '#A65F3B' }}>One Material Identity.</span>
            </h1>

            <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#6F6258', maxWidth: '580px', marginBottom: '36px' }}>
              An AI-driven framework for standardizing, harmonizing and intelligently managing material master data across Central Public Sector Enterprises.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link href="/login" className="cpcl-btn-primary">
                Explore Platform →
              </Link>
              <a href="#intelligence" className="cpcl-btn-secondary">
                Discover How It Works
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(217, 200, 180, 0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#6F6258' }}>
                <Building2 size={16} color="#A65F3B" />
                NMIP & CPSE Ecosystem
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#6F6258' }}>
                <ShieldCheck size={16} color="#5F775F" />
                Government Governed
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual: Material Identity Flow Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative' }}
          >
            <div style={{
              background: '#FBF8F2',
              border: '1px solid #D9C8B4',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 20px 60px rgba(43, 33, 27, 0.08)',
              position: 'relative'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #EADCC8', paddingBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', color: '#6F6258' }}>LIVE AI HARMONIZATION FLOW</span>
                <span style={{ fontSize: '10px', background: '#EADCC8', color: '#2B211B', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>SYNTHETIC STREAM</span>
              </div>

              {/* Source Records Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {/* Source A */}
                <motion.div
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  style={{
                    background: '#F4EBDD',
                    border: '1px solid #D9C8B4',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#A65F3B' }}>NMIP · MAT-10021</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B211B', marginTop: '2px' }}>SS PIPE 304 2" CL150</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6F6258', fontFamily: 'monospace' }}>UOM: EA</span>
                </motion.div>

                {/* Source B */}
                <motion.div
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  style={{
                    background: '#F4EBDD',
                    border: '1px solid #D9C8B4',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#6F6258' }}>IOCL · MAT-782341</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2B211B', marginTop: '2px' }}>STAINLESS PIPE 304 GRADE 2"</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6F6258', fontFamily: 'monospace' }}>UOM: NOS</span>
                </motion.div>
              </div>

              {/* Central AI Engine Node */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                <div style={{ height: '1px', background: '#D9C8B4', position: 'absolute', width: '100%', zIndex: 1 }}></div>
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    background: '#2B211B',
                    color: '#FBF8F2',
                    padding: '10px 24px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(43, 33, 27, 0.25)'
                  }}
                >
                  <Cpu size={15} color="#A65F3B" />
                  <span>AI MATCH ENGINE · 98.7%</span>
                </motion.div>
              </div>

              {/* Result: Common Material Identity */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                style={{
                  background: 'linear-gradient(135deg, #2B211B 0%, #403027 100%)',
                  color: '#FBF8F2',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  border: '1px solid #A65F3B',
                  boxShadow: '0 10px 30px rgba(166, 95, 59, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '1px', color: '#A65F3B', fontWeight: 700 }}>COMMON NATIONAL MATERIAL IDENTITY</span>
                  <span style={{ fontSize: '10px', background: '#5F775F', color: '#FBF8F2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>VERIFIED</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBF8F2', letterSpacing: '0.5px' }}>
                  NMC-SS304-002
                </div>
                <div style={{ fontSize: '12px', color: '#EADCC8', marginTop: '4px' }}>
                  Pipe, Stainless Steel SS304, Nominal Size 2 Inch, Class 150
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 4. TRUST STATEMENT */}
      <section style={{ background: '#EADCC8', padding: '45px 40px', borderTop: '1px solid #D9C8B4', borderBottom: '1px solid #D9C8B4' }} id="platform">
        <div className="cpcl-container">
          <div style={{ textAlign: 'center', marginBottom: '28px', fontSize: '12px', letterSpacing: '1.5px', fontWeight: 700, color: '#6F6258' }}>
            DESIGNED FOR INTELLIGENT MATERIAL GOVERNANCE ACROSS CPSEs
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
            {[
              { icon: Sparkles, label: 'AI-Assisted Material Matching' },
              { icon: ShieldCheck, label: 'Human-in-the-Loop Validation' },
              { icon: Database, label: 'Technical Attribute Intelligence' },
              { icon: Server, label: 'ERP / SAP Integration Ready' },
            ].map((pillar, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', background: 'rgba(251, 248, 242, 0.6)', borderRadius: '10px', border: '1px solid #D9C8B4' }}>
                <pillar.icon size={18} color="#A65F3B" />
                <span style={{ fontSize: '13px', fontWeight: 650, color: '#2B211B' }}>{pillar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE PROBLEM SECTION & MATERIAL FRAGMENTATION VISUAL */}
      <section className="cpcl-section" style={{ background: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              THE CHALLENGE
            </span>
            <h2 className="cpcl-heading-lg">
              Different Codes.<br />
              Different Descriptions.<br />
              One Material.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6F6258' }}>
              Across CPSEs, common or functionally equivalent materials can exist under different codes, descriptions, specifications, classifications and units of measurement.
            </p>
          </div>

          {/* Material Fragmentation Visual */}
          <div style={{ background: '#F4EBDD', border: '1px solid #D9C8B4', borderRadius: '20px', padding: '48px', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
              
              {/* Record 1 */}
              <div className="cpcl-card" style={{ background: '#FBF8F2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#A65F3B', marginBottom: '4px' }}>NMIP / CPSE-A</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6F6258', marginBottom: '12px' }}>CODE: MAT-10021</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>SS PIPE 304 2"</div>
                <div style={{ fontSize: '12px', color: '#6F6258' }}>UOM: EA · CLASS 150</div>
              </div>

              {/* Record 2 */}
              <div className="cpcl-card" style={{ background: '#FBF8F2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6F6258', marginBottom: '4px' }}>CPSE / IOCL</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6F6258', marginBottom: '12px' }}>CODE: MAT-782341</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>STAINLESS PIPE 304 GRADE</div>
                <div style={{ fontSize: '12px', color: '#6F6258' }}>UOM: NOS · 50.8MM</div>
              </div>

              {/* Record 3 */}
              <div className="cpcl-card" style={{ background: '#FBF8F2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6F6258', marginBottom: '4px' }}>CPSE / HPCL</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6F6258', marginBottom: '12px' }}>CODE: HP-304-221</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>SS 304 PIPE 2 INCH</div>
                <div style={{ fontSize: '12px', color: '#6F6258' }}>UOM: PCS · ASTM A312</div>
              </div>

            </div>

            {/* Connecting Flow Lines & Unified Output */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A65F3B', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                <GitCompare size={16} />
                <span>HARMONIZED INTO SINGLE NATIONAL IDENTITY</span>
              </div>
              <div style={{
                background: '#2B211B',
                color: '#FBF8F2',
                padding: '20px 40px',
                borderRadius: '14px',
                textAlign: 'center',
                border: '2px solid #A65F3B',
                boxShadow: '0 12px 35px rgba(43, 33, 27, 0.2)'
              }}>
                <div style={{ fontSize: '11px', color: '#A65F3B', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>COMMON NATIONAL MATERIAL IDENTITY</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBF8F2', letterSpacing: '1px' }}>NMC-SS304-002</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THE INTELLIGENT SOLUTION (Dark Deep Brown Section) */}
      <section className="cpcl-section" style={{ background: '#2B211B', color: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '70px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              THE INTELLIGENT SOLUTION
            </span>
            <h2 className="cpcl-heading-lg" style={{ color: '#FBF8F2' }}>
              From Fragmented Data<br />
              to Common Intelligence.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#EADCC8', opacity: 0.9 }}>
              The platform combines AI, NLP, technical attribute analysis, engineering rules and human validation to identify material relationships and recommend standardized identities.
            </p>
          </div>

          {/* 5 Vertical Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
            {[
              { num: '01', title: 'Understand', desc: 'Natural language description and technical term parsing' },
              { num: '02', title: 'Match', desc: 'Hybrid semantic and technical attribute vector matching' },
              { num: '03', title: 'Validate', desc: 'Rule-based verification & critical attribute conflict detection' },
              { num: '04', title: 'Harmonize', desc: 'Canonical attribute extraction and legacy mapping creation' },
              { num: '05', title: 'Govern', desc: 'Complete audit trail and role-based human approval workflows' },
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6 }}
                style={{
                  background: '#382B24',
                  border: '1px solid #4D3D33',
                  borderRadius: '14px',
                  padding: '28px 22px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#A65F3B', marginBottom: '12px' }}>{step.num}</div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#FBF8F2', marginBottom: '8px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: '#EADCC8', opacity: 0.8, lineHeight: 1.6 }}>{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. AI INTELLIGENCE SECTION */}
      <section className="cpcl-section" id="intelligence">
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              ENGINEERING DOMAIN ENGINE
            </span>
            <h2 className="cpcl-heading-lg">
              Intelligence Beyond<br />
              Text Similarity.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6F6258' }}>
              The platform does not rely only on description similarity. It applies deep engineering domain rules and multi-layered analysis.
            </p>
          </div>

          {/* 5 Horizontal Intelligence Layers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'Semantic Intelligence', desc: 'Understands descriptions, terminology, industry abbreviations and synonyms.' },
              { name: 'Technical Intelligence', desc: 'Understands material grade, nominal size, pressure class, standards and engineering attributes.' },
              { name: 'Classification Intelligence', desc: 'Identifies material families, taxonomy nodes and category hierarchies.' },
              { name: 'Historical Intelligence', desc: 'Utilizes procurement history, past mapping choices and legacy CPSE records.' },
              { name: 'Governance Intelligence', desc: 'Routes recommendations through human validation with full explainability.' },
            ].map((layer, i) => (
              <div key={i} className="cpcl-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#A65F3B', width: '30px' }}>0{i + 1}</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B211B', width: '220px' }}>{layer.name}</div>
                  <div style={{ fontSize: '13px', color: '#6F6258' }}>{layer.desc}</div>
                </div>
                <ChevronRight size={18} color="#A65F3B" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. AI MATCHING DEMONSTRATION (Interactive Split Screen) */}
      <section className="cpcl-section" style={{ background: '#EADCC8' }}>
        <div className="cpcl-container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              INTERACTIVE REASONING DEMO
            </span>
            <h2 className="cpcl-heading-lg" style={{ textAlign: 'center' }}>
              See How a Material Finds Its Common Identity
            </h2>
          </div>

          {/* Interactive Split Screen */}
          <div style={{ background: '#FBF8F2', border: '1px solid #D9C8B4', borderRadius: '20px', padding: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: '30px', alignItems: 'center' }}>
              
              {/* Left Source */}
              <div style={{ background: '#F4EBDD', padding: '24px', borderRadius: '14px', border: '1px solid #D9C8B4' }}>
                <div style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: 700, color: '#A65F3B', marginBottom: '6px' }}>SOURCE MATERIAL · NMIP</div>
                <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#6F6258' }}>MAT-10021</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B211B', marginTop: '10px', marginBottom: '14px' }}>
                  Stainless Steel Pipe 304 Grade 2 Inch
                </div>
                <div style={{ fontSize: '12px', color: '#6F6258', lineHeight: 1.6 }}>
                  Standard: ASTM A312<br />
                  Pressure Class: 150#<br />
                  Schedule: 40S
                </div>
              </div>

              {/* Center Match Score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '38px', fontWeight: 800, color: '#A65F3B', lineHeight: 1 }}>98.7%</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6F6258', marginTop: '6px', letterSpacing: '0.5px' }}>AI Match Confidence</div>
                <div style={{ fontSize: '10px', color: '#5F775F', fontWeight: 600, marginTop: '8px', background: 'rgba(95, 119, 95, 0.15)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  IDENTITY MATCH
                </div>
              </div>

              {/* Right Match */}
              <div style={{ background: '#F4EBDD', padding: '24px', borderRadius: '14px', border: '1px solid #D9C8B4' }}>
                <div style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: 700, color: '#6F6258', marginBottom: '6px' }}>TARGET MATCH · IOCL</div>
                <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#6F6258' }}>MAT-782341</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#2B211B', marginTop: '10px', marginBottom: '14px' }}>
                  SS Pipe Grade 304 2 Inch
                </div>
                <div style={{ fontSize: '12px', color: '#6F6258', lineHeight: 1.6 }}>
                  Standard: ASTM A312<br />
                  Pressure Class: 150#<br />
                  Schedule: 40S
                </div>
              </div>

            </div>

            {/* Breakdown Bars */}
            <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid #D9C8B4' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2B211B', marginBottom: '18px' }}>ENGINEERING ATTRIBUTE BREAKDOWN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
                {[
                  { attr: 'Description', score: '97%' },
                  { attr: 'Grade', score: '100%' },
                  { attr: 'Size', score: '100%' },
                  { attr: 'Specification', score: '99%' },
                  { attr: 'Classification', score: '98%' },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#6F6258', marginBottom: '6px' }}>
                      <span>{item.attr}</span>
                      <span style={{ color: '#2B211B', fontWeight: 700 }}>{item.score}</span>
                    </div>
                    <div style={{ height: '6px', background: '#EADCC8', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: item.score, height: '100%', background: '#A65F3B', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DO-NOT-MERGE INTELLIGENCE */}
      <section className="cpcl-section" style={{ background: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#7D4029', display: 'block', marginBottom: '10px' }}>
                CRITICAL TECHNICAL PROTECTION
              </span>
              <h2 className="cpcl-heading-lg">
                Similar Does Not Always<br />
                Mean Same.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6F6258', marginBottom: '24px' }}>
                The platform identifies critical technical conflicts before materials are considered for harmonization. Material grade differences (e.g. SS 304 vs SS 316) have distinct chemical profiles and must never be blindly merged.
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#7D4029', fontWeight: 700, fontSize: '13px' }}>
                <AlertTriangle size={18} />
                <span>Deterministic rules override high text similarity</span>
              </div>
            </div>

            {/* Conflict visual card */}
            <div style={{ background: '#F4EBDD', border: '1.5px solid #7D4029', borderRadius: '20px', padding: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#7D4029', letterSpacing: '1px' }}>CRITICAL ATTRIBUTE CONFLICT</span>
                <span style={{ fontSize: '10px', background: '#7D4029', color: '#FBF8F2', padding: '3px 10px', borderRadius: '4px', fontWeight: 700 }}>
                  DO NOT MERGE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', textAlign: 'center', background: '#FBF8F2', padding: '20px', borderRadius: '12px', border: '1px solid #D9C8B4' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6F6258' }}>MATERIAL A</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B211B', marginTop: '4px' }}>SS 304</div>
                  <div style={{ fontSize: '11px', color: '#6F6258', marginTop: '2px' }}>Carbon Steel / 18-8</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#7D4029' }}>VS</div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6F6258' }}>MATERIAL B</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#2B211B', marginTop: '4px' }}>SS 316</div>
                  <div style={{ fontSize: '11px', color: '#6F6258', marginTop: '2px' }}>Molybdenum Added</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#6F6258', marginTop: '16px', lineHeight: 1.5 }}>
                <strong>Engineering Constraint:</strong> Material grades SS304 and SS316 have different corrosion resistance profiles in chemical process environments. Automated merge blocked.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMMON NATIONAL MATERIAL CODE (Dark Deep Brown) */}
      <section className="cpcl-section" style={{ background: '#2B211B', color: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              TRACEABLE CODE ARCHITECTURE
            </span>
            <h2 className="cpcl-heading-lg" style={{ color: '#FBF8F2', textAlign: 'center' }}>
              One Common Identity.<br />
              Many Legacy Codes.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
            {/* Center NMC Node */}
            <div style={{
              background: 'linear-gradient(135deg, #382B24 0%, #2B211B 100%)',
              border: '2px solid #A65F3B',
              borderRadius: '16px',
              padding: '24px 48px',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(166, 95, 59, 0.25)'
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#A65F3B', fontWeight: 800, marginBottom: '6px' }}>
                COMMON NATIONAL MATERIAL CODE (NMC)
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#FBF8F2', letterSpacing: '1px' }}>
                NMC · SS304 · PIPE · 2"
              </div>
            </div>

            {/* Connecting Legacy Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', width: '100%' }}>
              {[
                { org: 'NMIP', code: 'MAT-10021', desc: 'SS PIPE 304 2"' },
                { org: 'IOCL', code: 'MAT-782341', desc: 'STAINLESS PIPE 304' },
                { org: 'HPCL', code: 'HP-304-221', desc: 'SS 304 PIPE 2 INCH' },
                { org: 'BPCL', code: 'BP-SS-9921', desc: 'PIPE SS304 50MM' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#382B24', border: '1px solid #4D3D33', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#A65F3B', fontWeight: 700 }}>{item.org}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FBF8F2', fontFamily: 'monospace', margin: '4px 0' }}>{item.code}</div>
                  <div style={{ fontSize: '11px', color: '#EADCC8', opacity: 0.8 }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#EADCC8', opacity: 0.85, textAlign: 'center' }}>
              Legacy identities remain traceable while common material identities become discoverable.
            </p>
          </div>
        </div>
      </section>

      {/* 11. GOVERNANCE SECTION */}
      <section className="cpcl-section" id="governance" style={{ background: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              HUMAN-IN-THE-LOOP CONTROL
            </span>
            <h2 className="cpcl-heading-lg">
              AI Recommends.<br />
              Experts Validate.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#6F6258' }}>
              No consequential identity merge occurs without explicit engineering review. Every decision is auditable and backed by evidence.
            </p>
          </div>

          {/* Workflow Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '50px' }}>
            {[
              'AI Recommendation',
              'Technical Review',
              'Material Master Validation',
              'Approval',
              'Audit Trail',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F4EBDD', border: '2px solid #A65F3B', display: 'grid', placeItems: 'center', fontSize: '14px', fontWeight: 800, color: '#A65F3B', marginBottom: '12px' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2B211B' }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="cpcl-card">
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>Transparent</h3>
              <p style={{ fontSize: '13px', color: '#6F6258', margin: 0 }}>Recommendations include explainable matching factors and critical attribute comparisons.</p>
            </div>
            <div className="cpcl-card">
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>Traceable</h3>
              <p style={{ fontSize: '13px', color: '#6F6258', margin: 0 }}>Material mappings maintain full legacy-code relationships and source evidence lineage.</p>
            </div>
            <div className="cpcl-card">
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>Governed</h3>
              <p style={{ fontSize: '13px', color: '#6F6258', margin: 0 }}>Final approval remains part of the controlled role-based engineering workflow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. NATIONAL SCALE SECTION */}
      <section className="cpcl-section" style={{ background: '#EADCC8' }}>
        <div className="cpcl-container" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
            CPSE ARCHITECTURE
          </span>
          <h2 className="cpcl-heading-lg" style={{ textAlign: 'center', marginBottom: '40px' }}>
            Built for the Complexity of CPSE Material Data.
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', flexWrap: 'wrap', fontSize: '16px', fontWeight: 700, color: '#2B211B' }}>
            <span>Oil & Gas</span>
            <span style={{ color: '#A65F3B' }}>│</span>
            <span>Power</span>
            <span style={{ color: '#A65F3B' }}>│</span>
            <span>Steel</span>
            <span style={{ color: '#A65F3B' }}>│</span>
            <span>Mining</span>
            <span style={{ color: '#A65F3B' }}>│</span>
            <span>Heavy Engineering</span>
          </div>
        </div>
      </section>

      {/* 13. IMPACT SECTION */}
      <section className="cpcl-section" id="impact" style={{ background: '#FBF8F2' }}>
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              STRATEGIC VALUE
            </span>
            <h2 className="cpcl-heading-lg">
              What Better Material<br />
              Intelligence Enables
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {[
              { title: 'Reduced Duplication', desc: 'Identify duplicate and near-duplicate records across plants and CPSE divisions.' },
              { title: 'Better Visibility', desc: 'Improve identification of equivalent materials and technical specifications.' },
              { title: 'Smarter Procurement', desc: 'Support demand aggregation, strategic sourcing, and vendor standardization.' },
              { title: 'Better Inventory Intelligence', desc: 'Improve understanding of common material requirements and inter-plant sharing.' },
              { title: 'Faster Specification Discovery', desc: 'Make standardized technical information easier to query and identify.' },
              { title: 'Data-Driven Decisions', desc: 'Enable analytics based on clean, harmonized material master identities.' },
            ].map((impact, i) => (
              <div key={i} className="cpcl-card">
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2B211B', marginBottom: '8px' }}>{impact.title}</div>
                <div style={{ fontSize: '13px', color: '#6F6258', lineHeight: 1.6 }}>{impact.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. PLATFORM CAPABILITIES GRID */}
      <section className="cpcl-section" style={{ background: '#F4EBDD' }}>
        <div className="cpcl-container">
          <div style={{ maxWidth: '650px', marginBottom: '60px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.8px', fontWeight: 700, color: '#A65F3B', display: 'block', marginBottom: '10px' }}>
              SYSTEM FEATURES
            </span>
            <h2 className="cpcl-heading-lg">
              Platform Capabilities
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[
              'AI Material Matching',
              'Material Standardization',
              'Duplicate Detection',
              'Common National Code',
              'CPSE Code Mapping',
              'Material Analytics',
              'Governance & Audit',
              'SAP / ERP Integration',
            ].map((cap, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, borderColor: '#A65F3B' }}
                style={{
                  background: '#FBF8F2',
                  border: '1px solid #D9C8B4',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#A65F3B', marginBottom: '10px' }}>0{i + 1}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2B211B' }}>{cap}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 15. FINAL CTA */}
      <section className="cpcl-section" style={{ background: '#A65F3B', color: '#FBF8F2' }}>
        <div className="cpcl-container" style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
          <h2 className="cpcl-heading-lg" style={{ color: '#2B211B', marginBottom: '20px' }}>
            From Many Codes<br />
            to One Common Language.
          </h2>
          <p style={{ fontSize: '16px', color: '#2B211B', opacity: 0.9, lineHeight: 1.7, marginBottom: '36px' }}>
            Explore an intelligent framework for material standardization, harmonization and governance across CPSEs.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/login" className="cpcl-btn-primary" style={{ background: '#2B211B', borderColor: '#2B211B', color: '#FBF8F2' }}>
              Explore the Platform →
            </Link>
            <Link href="/dashboard" className="cpcl-btn-secondary" style={{ borderColor: '#2B211B', color: '#2B211B' }}>
              View Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* 16. GOVERNMENT FOOTER */}
      <footer style={{ background: '#2B211B', color: '#EADCC8', padding: '60px 40px 30px', borderTop: '1px solid #3D3028' }}>
        <div className="cpcl-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '40px', marginBottom: '50px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FBF8F2', letterSpacing: '0.5px' }}>NMIP</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#A65F3B', marginTop: '2px' }}>National Material Intelligence Platform</div>
              <div style={{ fontSize: '11px', color: '#EADCC8', opacity: 0.7, marginTop: '4px' }}>Ministry of Petroleum & Natural Gas · Government of India</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBF8F2', marginBottom: '14px' }}>Navigation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', opacity: 0.8 }}>
                <a href="#overview">Overview</a>
                <a href="#platform">Platform</a>
                <a href="#intelligence">Intelligence</a>
                <a href="#governance">Governance</a>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBF8F2', marginBottom: '14px' }}>System</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', opacity: 0.8 }}>
                <Link href="/login">Access Portal</Link>
                <Link href="/dashboard">Workspace</Link>
                <Link href="/catalog">Catalog</Link>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBF8F2', marginBottom: '14px' }}>Government</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', opacity: 0.8 }}>
                <span>Accessibility</span>
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Disclaimer</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #3D3028', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.7 }}>
            <span>© 2026 National Material Intelligence Platform (NMIP). All rights reserved.</span>
            <span style={{ color: '#A65F3B', fontWeight: 600 }}>Demonstration / Prototype Interface</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
