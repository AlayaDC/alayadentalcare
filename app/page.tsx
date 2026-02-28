"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { createClient } from "../utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  role: string;
  image: string;
  position: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  slug: string;
  position: number;
}

interface Testimonial {
  text: string;
  author: string;
  role: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THEME_CONFIG = {
  primary: "#086351",
  accent: "#62B6B7",
  gold: "#C9A84C",
  cream: "#FAF7F2",
  dark: "#0D1F1C",
  charcoal: "#1A2E2A",
} as const;

const NAV_ITEMS = ["home", "about", "services", "doctors", "contact"] as const;

const TESTIMONIALS: Testimonial[] = [
  {
    text: "The team at Alaya Dental made me feel so comfortable. I used to fear dentist visits, but now I actually look forward to them! The results are amazing.",
    author: "Sarah Mitchell",
    role: "Marketing Manager",
  },
  {
    text: "Best dental experience ever! The staff is friendly, the facility is spotless, and my smile has never looked better. Highly recommend to everyone!",
    author: "James Rodriguez",
    role: "Business Owner",
  },
  {
    text: "I brought my whole family here and we all love it. The doctors are patient, especially with my kids. It's rare to find such quality care combined with genuine warmth.",
    author: "Emily Chen",
    role: "Teacher",
  },
];

const STATS = [
  { value: "15+", label: "Years Experience", icon: "bi-award-fill" },
  { value: "50K+", label: "Happy Patients", icon: "bi-emoji-smile-fill" },
  { value: "95%", label: "Success Rate", icon: "bi-graph-up-arrow" },
];

const ABOUT_FEATURES = [
  {
    icon: "bi-heart-pulse-fill",
    title: "Advanced Technology",
    description: "Latest equipment for precise treatments",
  },
  {
    icon: "bi-people-fill",
    title: "Expert Team",
    description: "Certified specialists with 15+ years",
  },
  {
    icon: "bi-shield-fill-check",
    title: "100% Sterilized",
    description: "Highest hygiene standards maintained",
  },
  {
    icon: "bi-clock-fill",
    title: "Flexible Hours",
    description: "Evening & weekend appointments",
  },
];

// ─── Custom Hooks ─────────────────────────────────────────────────────────────
const useScrollState = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<
    (typeof NAV_ITEMS)[number]
  >("home");
  const isNavigating = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      if (isNavigating.current) return;

      const navbarHeight = 100;
      const scrollPosition = window.scrollY + navbarHeight;

      let currentSection: (typeof NAV_ITEMS)[number] = "home";

      for (const section of NAV_ITEMS) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            currentSection = section;
          }
        }
      }

      if (
        Math.ceil(window.innerHeight + window.scrollY) >=
        document.documentElement.scrollHeight - 50
      ) {
        currentSection = "contact";
      }

      setActiveNavItem(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const setManualNav = useCallback((item: (typeof NAV_ITEMS)[number]) => {
    isNavigating.current = true;
    setActiveNavItem(item);
    setTimeout(() => {
      isNavigating.current = false;
    }, 1200);
  }, []);

  return { isScrolled, activeNavItem, setManualNav };
};

const useSupabaseData = <T,>(table: string, limit: number) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/supabase-data?table=${table}&limit=${limit}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch data");
        }

        if (mounted && result.data) setData(result.data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          console.error(`Error fetching ${table}:`, err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [table, limit]);

  return { data, loading, error };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { isScrolled, activeNavItem, setManualNav } = useScrollState();
  const { data: doctors, loading: doctorsLoading } =
    useSupabaseData<Doctor>("doctors", 4);
  const { data: services, loading: servicesLoading } =
    useSupabaseData<Service>("services", 6);

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    const isMobile = window.innerWidth < 992;

    if (!isMobile) {
      AOS.init({
        duration: 600,
        offset: 100,
        once: true,
        easing: "ease-out-cubic",
        disable: false,
        startEvent: "DOMContentLoaded",
        anchorPlacement: "top-bottom",
      });
    } else {
      AOS.init({ disable: true });
    }

    document.documentElement.style.scrollBehavior = "smooth";

    const handleResize = () => {
      if (!isMobile) AOS.refresh();
    };

    const timer = setTimeout(() => {
      if (!isMobile) AOS.refresh();
    }, 500);

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 992;
    if (!doctorsLoading && !servicesLoading && !isMobile) {
      setTimeout(() => AOS.refresh(), 100);
      setTimeout(() => AOS.refresh(), 300);
    }
  }, [doctorsLoading, servicesLoading]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(1.05)";
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  }, []);

  return (
    <main id="home">
      <GlobalStyles
        themeColor={THEME_CONFIG.primary}
        accentColor={THEME_CONFIG.accent}
      />
      <TopBar />
      <Navigation
        isScrolled={isScrolled}
        activeNavItem={activeNavItem}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        setManualNav={setManualNav}
      />
      
      {/* 🚀 THE FIX: This wrapper forces all sections to stay strictly within the screen width, 
          cutting off the white gap, without breaking the sticky navbar above it! */}
      <div style={{ overflowX: "hidden", width: "100%" }}>
        <HeroSection />
        <AboutSection />
        <ServicesSection services={services} loading={servicesLoading} />
        <DoctorsSection doctors={doctors} loading={doctorsLoading} />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}

// ─── GlobalStyles ─────────────────────────────────────────────────────────────
const GlobalStyles = ({
  themeColor,
  accentColor,
}: {
  themeColor: string;
  accentColor: string;
}) => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --primary:    ${themeColor};
      --accent:     ${accentColor};
      --gold:       #C9A84C;
      --gold-light: rgba(201,168,76,0.15);
      --cream:      #FAF7F2;
      --dark:       #0D1F1C;
      --charcoal:   #1A2E2A;
      --muted:      #6B7B78;
      --card-bg:    #FFFFFF;
      --section-alt: #F4F9F8;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    /* Fixed overflow on html to allow sticky navbar to work */
    html { 
      scroll-behavior: smooth; 
    }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #fff;
      color: #1A2E2A;
      -webkit-text-size-adjust: 100%; 
      max-width: 100%;
      overflow-x: hidden;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Playfair Display', Georgia, serif;
    }

    /* ── Mobile: kill AOS ── */
    @media (max-width: 991px) {
      [data-aos] {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }

    /* ── Keyframes ── */
    @keyframes gradient-shift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-22px) rotate(3deg); }
    }
    @keyframes float-reverse {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(18px) rotate(-2deg); }
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(8,99,81,0.35); }
      50%      { box-shadow: 0 0 0 10px rgba(8,99,81,0); }
    }
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    @keyframes shimmer-gold {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes ticker {
      0%   { opacity:0; transform: translateY(8px); }
      15%  { opacity:1; transform: translateY(0); }
      85%  { opacity:1; transform: translateY(0); }
      100% { opacity:0; transform: translateY(-8px); }
    }

    /* ── Typography helpers ── */
    .font-serif { font-family: 'Playfair Display', Georgia, serif !important; }

    .gradient-text {
      background: linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gold-text {
      background: linear-gradient(135deg, #C9A84C 0%, #E8C96B 50%, #C9A84C 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer-gold 3s linear infinite;
    }

    /* ── TopBar ── */
    .topbar-ticker span { animation: ticker 4s ease infinite; }

    /* ── Navbar ── */
    .navbar-luxury {
      position: sticky !important;
      top: 0 !important;
      z-index: 1030 !important;
      background: rgba(250,247,242,0.96) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transition: all 0.35s ease;
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    .navbar-scrolled {
      background: rgba(255,255,255,0.98) !important;
      box-shadow: 0 4px 30px rgba(8,99,81,0.10);
    }

    .nav-link-luxury {
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--charcoal) !important;
      padding: 0.5rem 0.85rem !important;
      transition: color 0.3s ease;
    }
    .nav-link-luxury:hover,
    .nav-link-luxury.active { color: var(--primary) !important; }

    /* ── Buttons ── */
    .btn-luxury-primary {
      background: var(--dark);
      color: var(--cream);
      border: 1.5px solid var(--dark);
      border-radius: 4px;
      padding: 0.8rem 2.2rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.35s ease;
      position: relative;
      overflow: hidden;
    }
    .btn-luxury-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      opacity: 0;
      transition: opacity 0.35s ease;
    }
    .btn-luxury-primary:hover::before { opacity: 1; }
    .btn-luxury-primary:hover { color: #fff; border-color: transparent; transform: translateY(-2px); }
    .btn-luxury-primary span, .btn-luxury-primary i { position: relative; z-index: 1; }

    .btn-luxury-outline {
      background: transparent;
      color: var(--cream);
      border: 1.5px solid rgba(255,255,255,0.5);
      border-radius: 4px;
      padding: 0.78rem 2.2rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.35s ease;
    }
    .btn-luxury-outline:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.85);
      color: #fff;
    }

    .btn-book-nav {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff !important;
      border: none;
      border-radius: 4px;
      padding: 0.55rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(8,99,81,0.28);
    }
    .btn-book-nav:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(8,99,81,0.38);
      color: #fff !important;
    }

    /* ── Hero ── */
    .hero-section {
      min-height: 90svh;
      background: var(--dark);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
    }
    .hero-grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(98,182,183,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(98,182,183,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }
    .hero-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid var(--gold);
      border-radius: 2px;
      padding: 0.4rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.8rem, 6vw, 5.5rem);
      font-weight: 700;
      line-height: 1.05;
      color: var(--cream);
    }
    .hero-title em {
      font-style: italic;
      color: var(--accent);
    }
    .hero-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, var(--gold), var(--accent));
      margin: 1.5rem 0;
    }
    .hero-stat-card {
      border-left: 2px solid rgba(201,168,76,0.4);
      padding: 0.5rem 0 0.5rem 1.2rem;
    }
    .hero-stat-value {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--cream);
      line-height: 1;
    }
    .hero-stat-label {
      font-size: 0.72rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-top: 0.2rem;
    }
    .hero-image-wrap {
      position: relative;
    }
    .hero-image-frame {
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }
    .hero-image-frame::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 50%, rgba(13,31,28,0.5) 100%);
    }
    .hero-image-frame img {
      width: 100%;
      height: 580px;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .hero-corner-badge {
      position: absolute;
      background: var(--gold);
      color: var(--dark);
      font-weight: 700;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
      padding: 0.9rem 1.3rem;
      border-radius: 2px;
      z-index: 2;
      font-family: 'Inter', sans-serif;
    }
    .hero-scroll-line {
      position: absolute;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.35);
      font-size: 0.65rem;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .hero-scroll-line::after {
      content: '';
      width: 1px;
      height: 50px;
      background: linear-gradient(to bottom, rgba(201,168,76,0.6), transparent);
      animation: float-reverse 2s ease-in-out infinite;
    }

    /* ── About ── */
    .about-section { background: var(--cream); }
    .about-image-container { position: relative; }
    .about-image-main {
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 24px 24px 0px rgba(8,99,81,0.12);
    }
    .about-image-main img { width: 100%; height: 520px; object-fit: cover; display: block; }
    .about-exp-badge {
      position: absolute;
      bottom: -20px;
      right: -20px;
      width: 130px;
      height: 130px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-family: 'Playfair Display', serif;
      text-align: center;
      box-shadow: 0 12px 36px rgba(8,99,81,0.30);
      border: 4px solid var(--cream);
    }
    .about-exp-badge .number { font-size: 2.4rem; font-weight: 700; line-height: 1; }
    .about-exp-badge .label { font-size: 0.65rem; font-weight: 400; opacity: 0.85; letter-spacing: 0.5px; }
    .about-section-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .about-section-label::before {
      content: '';
      width: 32px;
      height: 2px;
      background: var(--gold);
      flex-shrink: 0;
    }
    .feature-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border-radius: 2px;
      transition: background 0.3s ease;
    }
    .feature-row:hover { background: rgba(8,99,81,0.04); }
    .feature-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 2px;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fff;
    }

    /* ── Services ── */
    .services-section { background: var(--dark); }
    .service-card-luxury {
      background: var(--charcoal);
      border: 1px solid rgba(98,182,183,0.10);
      border-radius: 2px;
      padding: 2.2rem;
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
      height: 100%;
    }
    .service-card-luxury::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 3px;
      height: 0;
      background: linear-gradient(to bottom, var(--gold), var(--accent));
      transition: height 0.4s ease;
    }
    .service-card-luxury:hover::after { height: 100%; }
    .service-card-luxury:hover {
      border-color: rgba(98,182,183,0.25);
      transform: translateY(-6px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    }
    .service-icon-wrap {
      width: 58px;
      height: 58px;
      border-radius: 2px;
      border: 1px solid rgba(201,168,76,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }
    .service-card-luxury:hover .service-icon-wrap {
      background: var(--gold);
      border-color: var(--gold);
    }
    .service-card-luxury:hover .service-icon-wrap i { color: var(--dark) !important; }
    .service-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--accent);
      text-decoration: none;
      transition: gap 0.3s ease, color 0.3s ease;
    }
    .service-link:hover { gap: 1rem; color: var(--gold); }

    /* ── Doctors ── */
    .doctors-section { background: var(--cream); }
    .doctor-card-luxury {
      background: #fff;
      border-radius: 2px;
      overflow: hidden;
      transition: all 0.35s ease;
      box-shadow: 0 4px 24px rgba(13,31,28,0.07);
      height: 100%;
    }
    .doctor-card-luxury:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(13,31,28,0.14);
    }
    .doctor-img-wrap {
      position: relative;
      overflow: hidden;
      height: 300px;
    }
    .doctor-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    .doctor-card-luxury:hover .doctor-img { transform: scale(1.06); }
    .doctor-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(13,31,28,0.85) 0%, transparent 55%);
    }
    .doctor-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1.2rem;
    }
    .doctor-name { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #fff; margin: 0; }
    .doctor-role { font-size: 0.75rem; color: var(--accent); letter-spacing: 0.5px; }
    
    .doctor-availability {
      padding: 1rem 1.2rem;
      border-top: 1px solid rgba(8,99,81,0.07);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--primary);
      background: rgba(8,99,81,0.02);
    }
    .availability-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
      box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
      animation: pulse-green 2s infinite;
    }

    /* ── Testimonials ── */
    .testimonials-section {
      background: linear-gradient(135deg, var(--dark) 0%, var(--charcoal) 100%);
      position: relative;
      overflow: hidden;
    }
    .testimonials-section::before {
      content: '"';
      position: absolute;
      font-family: 'Playfair Display', serif;
      font-size: 30rem;
      color: rgba(98,182,183,0.03);
      top: -6rem;
      left: -2rem;
      line-height: 1;
      pointer-events: none;
    }
    .testimonial-card-luxury {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(98,182,183,0.12);
      border-radius: 2px;
      padding: 3rem;
    }
    @media (max-width: 575px) { .testimonial-card-luxury { padding: 2rem 1.5rem; } }
    .quote-mark {
      font-family: 'Playfair Display', serif;
      font-size: 4rem;
      color: var(--gold);
      line-height: 0.6;
      opacity: 0.7;
      margin-bottom: 1.5rem;
      display: block;
    }
    .testimonial-stars i { color: var(--gold); font-size: 0.85rem; }
    .testimonial-author-line {
      width: 30px;
      height: 2px;
      background: var(--gold);
      margin: 0.75rem 0;
    }
    .swiper-pagination-bullet { background: rgba(255,255,255,0.3); opacity: 1; }
    .swiper-pagination-bullet-active { background: var(--gold); width: 28px; border-radius: 2px; }

    /* ── CTA ── */
    .cta-section {
      background: var(--cream);
      position: relative;
      overflow: hidden;
    }
    .cta-inner {
      background: linear-gradient(135deg, var(--primary) 0%, var(--charcoal) 100%);
      border-radius: 4px;
      padding: 5rem 3rem;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 575px) { .cta-inner { padding: 3rem 1.5rem; } }
    .cta-inner::before {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      border: 1px solid rgba(201,168,76,0.15);
      top: -200px; right: -150px;
      animation: spin-slow 20s linear infinite;
    }
    .cta-inner::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      border: 1px solid rgba(98,182,183,0.10);
      bottom: -100px; left: -80px;
      animation: spin-slow 14s linear infinite reverse;
    }

    /* ── Footer ── */
    .footer-luxury {
      background: var(--dark);
      border-top: 1px solid rgba(201,168,76,0.15);
    }
    .footer-brand-line {
      width: 40px;
      height: 2px;
      background: var(--gold);
      margin: 1rem 0;
    }
    .footer-heading {
      font-family: 'Inter', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 1.25rem;
    }
    .footer-link {
      color: rgba(255,255,255,0.45);
      text-decoration: none;
      font-size: 0.88rem;
      transition: color 0.3s ease;
      display: inline-block;
    }
    .footer-link:hover { color: var(--accent); }
    .footer-social {
      width: 36px; height: 36px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.45);
      text-decoration: none;
      transition: all 0.3s ease;
      font-size: 0.85rem;
    }
    .footer-social:hover {
      background: var(--gold);
      border-color: var(--gold);
      color: var(--dark);
      transform: translateY(-3px);
    }
    .footer-contact-row {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 0.9rem;
      font-size: 0.87rem;
      color: rgba(255,255,255,0.45);
    }
    .footer-contact-row i { color: var(--accent); margin-top: 2px; flex-shrink: 0; }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 1.5rem 0;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.25);
    }

    /* ── Loading ── */
    .loading-luxury {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 0;
      gap: 1rem;
    }
    .loading-ring {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(8,99,81,0.1);
      border-top-color: var(--primary);
      animation: spin-slow 0.9s linear infinite;
    }
    .hover-lift {
      transition: all 0.3s ease;
    }
    .hover-lift:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
    }

    /* ── Responsive ── */
    @media (max-width: 991px) {
      .hero-title { font-size: clamp(2.2rem, 8vw, 3.5rem); }
      .about-image-main img { height: 380px; }
      .about-exp-badge { right: 10px; bottom: 10px; width: 100px; height: 100px; }
      .about-exp-badge .number { font-size: 1.8rem; }
      .hero-image-frame img { height: 380px; }
      .hero-scroll-line { display: none; }
    }
    @media (max-width: 767px) {
      .hero-image-frame, .hero-corner-badge { display: none !important; }
      .testimonial-card-luxury { padding: 1.75rem 1.25rem; }
      .cta-inner { padding: 2.5rem 1.25rem; border-radius: 2px; }
    }
    @media (max-width: 575px) {
      .about-exp-badge { width: 88px; height: 88px; right: 8px; bottom: -16px; }
      .about-image-main img { height: 300px; }
      .hero-stat-card { border-left-width: 1.5px; padding-left: 0.8rem; }
      .hero-stat-value { font-size: 1.4rem; }
    }

    /* ── Section utility ── */
    .section-py { padding: 4rem 0; }
    @media (max-width: 767px) { .section-py { padding: 4rem 0; } }
    .section-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
  `,
    }}
  />
);

// ─── TopBar ───────────────────────────────────────────────────────────────────
const TopBar = () => (
  <div
    className="text-white py-2 d-none d-lg-block position-relative overflow-hidden"
    style={{
      background: `linear-gradient(270deg, ${THEME_CONFIG.primary}, ${THEME_CONFIG.charcoal}, ${THEME_CONFIG.primary})`,
      backgroundSize: "300% 100%",
      animation: "gradient-shift 8s ease infinite",
    }}
  >
    <div className="container">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-4">
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-clock-fill" style={{ color: THEME_CONFIG.gold, fontSize: "0.75rem" }}></i>
            <small className="fw-semibold" style={{ fontSize: "0.78rem", letterSpacing: "0.3px" }}>
              Mon – Sat: 10:00 AM – 8:00 PM
            </small>
          </span>
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-telephone-fill" style={{ color: THEME_CONFIG.gold, fontSize: "0.75rem" }}></i>
            <small className="fw-semibold" style={{ fontSize: "0.78rem" }}>+91 8848659365</small>
          </span>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <span style={{ fontSize: "0.7rem", letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.5 }}>Follow</span>
          {(["facebook", "instagram", "whatsapp"] as const).map((social) => (
            <a
              key={social}
              href="#"
              className="text-white text-decoration-none"
              style={{ opacity: 0.6, fontSize: "0.9rem", transition: "opacity 0.3s" }}
              aria-label={social}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              <i className={`bi bi-${social}`}></i>
            </a>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Navigation ───────────────────────────────────────────────────────────────
interface NavigationProps {
  isScrolled: boolean;
  activeNavItem: (typeof NAV_ITEMS)[number];
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void;
  setManualNav: (item: (typeof NAV_ITEMS)[number]) => void;
}

const Navigation = ({
  isScrolled,
  activeNavItem,
  onMouseEnter,
  onMouseLeave,
  setManualNav,
}: NavigationProps) => {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: string
  ) => {
    e.preventDefault();
    setManualNav(item as (typeof NAV_ITEMS)[number]);

    const navbarToggler = document.querySelector(
      ".navbar-toggler"
    ) as HTMLElement;
    const navbarCollapse = document.getElementById("navbarNav");
    if (
      navbarCollapse &&
      navbarCollapse.classList.contains("show") &&
      navbarToggler
    ) {
      navbarToggler.click();
    }

    const element = document.getElementById(item);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.offsetTop - navbarHeight;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-luxury ${isScrolled ? "navbar-scrolled" : ""}`}
    >
      <div className="container">
        {/* Brand */}
       <Link
          className="navbar-brand d-flex align-items-center gap-3 text-decoration-none"
          href="/#home"
        >
          {/* ── Logo with glow pulse effect ── */}
          <div
            style={{
              position: "relative",
              width: 52,
              height: 52,
              flexShrink: 0,
            }}
          >
            {/* Animated glow ring behind logo */}
            <div
              style={{
                position: "absolute",
                inset: -1,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${THEME_CONFIG.primary}, ${THEME_CONFIG.accent})`,
                animation: "pulse-glow 3s ease-in-out infinite",
                zIndex: 0,
              }}
            />
            <img
              src="/images/adc.png"
              alt="Alaya Dental Care"
              style={{
                position: "relative",
                zIndex: 1,
                width: 52,
                height: 52,
                objectFit: "contain",
                borderRadius: 8,
                background: "#fff",
                padding: 3,
              }}
            />
          </div>

          {/* Brand text */}
          <div>
            <div
              className="gradient-text"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.1,
              }}
            >
              Alaya Dental Care
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: THEME_CONFIG.gold,
                fontWeight: 600,
              }}
            >
              Premium Dental Studio
            </div>
          </div>
        </Link>


        {/* Toggler */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: THEME_CONFIG.primary }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links */}
        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarNav"
        >
          <ul className="navbar-nav align-items-lg-center gap-lg-1 py-3 py-lg-0">
            {NAV_ITEMS.map((item) => (
              <li className="nav-item" key={item}>
                <a
                  className={`nav-link-luxury ${activeNavItem === item ? "active" : ""}`}
                  href={`#${item}`}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </a>
              </li>
            ))}
            <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
              <Link
                href="/book"
                className="btn-book-nav"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                <i className="bi bi-calendar-check me-2"></i>Book Now
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

// ─── Hero Section ─────────────────────────────────────────────────────────────
const HeroSection = () => (
  <section className="hero-section">
    {/* Grid bg */}
    <div className="hero-grid-bg" />

    {/* Glow blobs */}
    <div
      className="hero-glow"
      style={{
        width: 500,
        height: 500,
        background: `radial-gradient(circle, rgba(8,99,81,0.25) 0%, transparent 70%)`,
        top: -100,
        left: -100,
        animation: "float 10s ease-in-out infinite",
      }}
    />
    <div
      className="hero-glow"
      style={{
        width: 400,
        height: 400,
        background: `radial-gradient(circle, rgba(98,182,183,0.15) 0%, transparent 70%)`,
        bottom: -50,
        right: -50,
        animation: "float-reverse 8s ease-in-out infinite",
      }}
    />

    <div className="container position-relative py-5" style={{ zIndex: 1 }}>
      <div className="row align-items-center g-5">

        {/* Text */}
        <div className="col-lg-6" data-aos="fade-right" data-aos-offset="50">
          <div className="hero-badge">
            <i className="bi bi-award-fill" style={{ color: THEME_CONFIG.gold }}></i>
            Kerala's #1 Dental Studio
          </div>

          <h1 className="hero-title">
            Your Smile, <br />
            <em>Reimagined.</em>
          </h1>

          <div className="hero-divider" />

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "1rem",
              lineHeight: 1.8,
              maxWidth: 460,
              marginBottom: "2.5rem",
            }}
          >
            Experience world-class dental care with cutting-edge technology and
            compassionate experts who treat you like family.
          </p>

          <div className="d-flex flex-wrap gap-3 mb-5">
            <Link href="/book" className="btn-luxury-primary">
              <span>
                <i className="bi bi-calendar-check me-2"></i>Book Appointment
              </span>
            </Link>
            <a href="#services" className="btn-luxury-outline">
              Our Services
            </a>
          </div>

          {/* Stats */}
          <div className="d-flex flex-wrap gap-4">
            {STATS.map((stat, idx) => (
              <div className="hero-stat-card" key={idx}>
                <div className="hero-stat-value">{stat.value}</div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Image — hidden on mobile */}
        <div
          className="col-lg-6 d-none d-lg-block"
          data-aos="fade-left"
          data-aos-offset="50"
        >
          <div className="hero-image-wrap">
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800&auto=format&fit=crop"
                alt="Dental Care"
                loading="eager"
              />
            </div>

            {/* Corner badge */}
            <div
              className="hero-corner-badge"
              data-aos="zoom-in"
              data-aos-delay="300"
              style={{ bottom: 28, left: -20 }}
            >
              <div style={{ fontSize: "1.4rem", fontFamily: "'Playfair Display', serif" }}>100%</div>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.5px", marginTop: "2px" }}>Sterilized & Safe</div>
            </div>

            {/* Top right badge */}
            <div
              className="position-absolute d-flex align-items-center gap-2"
              style={{
                top: 20,
                right: -16,
                background: "rgba(13,31,28,0.90)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 2,
                padding: "0.7rem 1rem",
              }}
              data-aos="zoom-in"
              data-aos-delay="400"
            >
              <div>
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className="bi bi-star-fill"
                    style={{ color: THEME_CONFIG.gold, fontSize: "0.7rem" }}
                  ></i>
                ))}
                <div
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.68rem",
                    marginTop: "2px",
                  }}
                >
                  Trusted by 10K+ Families
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Scroll indicator */}
    <div className="hero-scroll-line">Scroll</div>
  </section>
);

// ─── About Section ────────────────────────────────────────────────────────────
const AboutSection = () => (
  <section id="about" className="about-section section-py">
    <div className="container">
      <div className="row align-items-center g-5">

        {/* Image */}
        <div
          className="col-lg-6"
          data-aos="fade-right"
          data-aos-offset="50"
        >
          <div className="about-image-container pb-4 pb-lg-0">
            <div className="about-image-main">
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=800&auto=format&fit=crop"
                alt="Modern Clinic"
                loading="lazy"
              />
            </div>
            <div className="about-exp-badge">
              <span className="number">15+</span>
              <span className="label">Years of<br />Excellence</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-lg-6" data-aos="fade-left" data-aos-offset="50">
          <div className="about-section-label">About Alaya Dental</div>
          <h2
            className="font-serif mb-4"
            style={{
              fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: THEME_CONFIG.charcoal,
            }}
          >
            Excellence in Dental Care{" "}
            <span className="gradient-text">Since 2009</span>
          </h2>
          <p
            className="mb-5"
            style={{
              color: "#6B7B78",
              fontSize: "1rem",
              lineHeight: 1.85,
            }}
          >
            We're not just a dental clinic—we're your partners in achieving and
            maintaining the perfect smile. With state-of-the-art technology and
            a team of passionate professionals, we make dental care comfortable,
            efficient, and effective.
          </p>

          <div className="row g-3 mb-5">
            {ABOUT_FEATURES.map((feature, idx) => (
              <div className="col-sm-6" key={idx}>
                <div className="feature-row">
                  <div className="feature-icon-box">
                    <i className={`bi ${feature.icon}`} style={{ fontSize: "1rem" }}></i>
                  </div>
                  <div>
                    <div
                      className="fw-semibold mb-1"
                      style={{ fontSize: "0.9rem", color: THEME_CONFIG.charcoal }}
                    >
                      {feature.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6B7B78" }}>
                      {feature.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/book" className="btn-luxury-primary">
            <span>
              Schedule Your Visit <i className="bi bi-arrow-right ms-1"></i>
            </span>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ─── Services Section ─────────────────────────────────────────────────────────
interface ServicesSectionProps {
  services: Service[];
  loading: boolean;
}

const ServicesSection = ({ services, loading }: ServicesSectionProps) => (
  <section id="services" className="services-section section-py">
    <div className="container">

      {/* Header */}
      <div
        className="row mb-5 align-items-end"
        data-aos="fade-up"
        data-aos-offset="50"
      >
        <div className="col-lg-7">
          <div
            className="section-label mb-3"
            style={{ color: THEME_CONFIG.gold, letterSpacing: "3px" }}
          >
            <span
              style={{
                display: "inline-block",
                width: 28,
                height: 2,
                background: THEME_CONFIG.gold,
                marginRight: "0.75rem",
                verticalAlign: "middle",
              }}
            />
            Our Services
          </div>
          <h2
            className="font-serif text-white"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", fontWeight: 700 }}
          >
            Comprehensive{" "}
            <span style={{ color: THEME_CONFIG.accent }}>Dental Solutions</span>
          </h2>
        </div>
        <div className="col-lg-5 text-lg-end mt-3 mt-lg-0">
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", lineHeight: 1.7 }}>
            From routine checkups to advanced treatments, we've got your smile covered
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="row g-4">
        {loading ? (
          <LoadingSpinner message="Loading our dental services..." />
        ) : (
          services.map((service, idx) => (
            <div
              className="col-md-6 col-lg-4"
              key={service.id}
              data-aos="fade-up"
              data-aos-offset="50"
              data-aos-delay={idx * 50}
            >
              <div className="service-card-luxury">
                <div className="service-icon-wrap">
                  <i
                    className={`bi ${service.icon} fs-4`}
                    style={{ color: THEME_CONFIG.accent }}
                  ></i>
                </div>
                <h5
                  className="font-serif mb-3"
                  style={{ color: "#fff", fontSize: "1.1rem" }}
                >
                  {service.title}
                </h5>
                <p
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.88rem",
                    lineHeight: 1.75,
                    marginBottom: "1.5rem",
                  }}
                >
                  {service.description}
                </p>
                <Link
                  href={`/services/${service.slug}`}
                  className="service-link"
                >
                  Learn More <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-5" data-aos="fade-up" data-aos-offset="50">
        <Link href="/services" className="btn-luxury-outline">
          See All Services <i className="bi bi-arrow-right ms-1"></i>
        </Link>
      </div>
    </div>
  </section>
);

// ─── Doctors Section ──────────────────────────────────────────────────────────
interface DoctorsSectionProps {
  doctors: Doctor[];
  loading: boolean;
}

const DoctorsSection = ({ doctors, loading }: DoctorsSectionProps) => (
  <section id="doctors" className="doctors-section section-py">
    <div className="container">

      <div className="text-center mb-5" data-aos="fade-up" data-aos-offset="50">
        <div
          className="section-label mb-3"
          style={{ color: THEME_CONFIG.primary, letterSpacing: "3px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 2,
              background: THEME_CONFIG.gold,
              marginRight: "0.75rem",
              verticalAlign: "middle",
            }}
          />
          Meet Our Team
        </div>
        <h2
          className="font-serif"
          style={{
            fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
            fontWeight: 700,
            color: THEME_CONFIG.charcoal,
          }}
        >
          Expert{" "}
          <span className="gradient-text">Dental Professionals</span>
        </h2>
        <p
          className="mt-3"
          style={{ color: "#6B7B78", maxWidth: 520, margin: "0.75rem auto 0" }}
        >
          Certified specialists dedicated to your oral health and beautiful smile
        </p>
      </div>

      <div className="row g-4">
        {loading ? (
          <LoadingSpinner message="Loading our expert team..." />
        ) : (
          doctors.map((doctor, idx) => (
            <div
              className="col-md-6 col-lg-3"
              key={doctor.id}
              data-aos="fade-up"
              data-aos-offset="50"
              data-aos-delay={idx * 50}
            >
              <div className="doctor-card-luxury">
                <div className="doctor-img-wrap">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="doctor-img"
                    loading="lazy"
                  />
                  <div className="doctor-overlay" />
                  <div className="doctor-info">
                    <div className="doctor-name">{doctor.name}</div>
                    <div className="doctor-role">{doctor.role}</div>
                  </div>
                </div>
                {/* ── Replacement for social icons: "Available Today" ── */}
                <div className="doctor-availability">
                  <span className="availability-dot"></span>
                  Available Today
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-5" data-aos="fade-up" data-aos-offset="50">
        <Link href="/doctors" className="btn-luxury-primary">
          <span>
            See All Doctors <i className="bi bi-arrow-right ms-1"></i>
          </span>
        </Link>
      </div>
    </div>
  </section>
);

// ─── Testimonials Section ─────────────────────────────────────────────────────
const TestimonialsSection = () => (
  <section className="testimonials-section section-py">
    <div className="container">

      <div className="text-center mb-5" data-aos="fade-up" data-aos-offset="50">
        <div
          className="section-label mb-3 d-inline-block"
          style={{ color: THEME_CONFIG.gold, letterSpacing: "3px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 2,
              background: THEME_CONFIG.gold,
              marginRight: "0.75rem",
              verticalAlign: "middle",
            }}
          />
          Patient Stories
        </div>
        <h2
          className="font-serif text-white"
          style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", fontWeight: 700 }}
        >
          What Our{" "}
          <span style={{ color: THEME_CONFIG.accent }}>Patients Say</span>
        </h2>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7" data-aos="fade-up" data-aos-offset="50">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            observer={true}
            observeParents={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            className="pb-5"
          >
            {TESTIMONIALS.map((testimonial, idx) => (
              <SwiperSlide key={idx}>
                <div className="testimonial-card-luxury">
                  <span className="quote-mark">"</span>
                  <div className="testimonial-stars mb-3">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="bi bi-star-fill me-1"></i>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.70)",
                      fontSize: "1rem",
                      lineHeight: 1.85,
                      fontStyle: "italic",
                      marginBottom: "2rem",
                    }}
                  >
                    {testimonial.text}
                  </p>
                  <div className="testimonial-author-line" />
                  <div
                    className="fw-bold text-white font-serif"
                    style={{ fontSize: "1rem" }}
                  >
                    {testimonial.author}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: THEME_CONFIG.accent,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {testimonial.role}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  </section>
);

// ─── CTA Section ──────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="cta-section section-py">
    <div className="container">
      <div className="cta-inner" data-aos="zoom-in" data-aos-offset="50">
        <div className="row justify-content-center text-center position-relative" style={{ zIndex: 1 }}>
          <div className="col-lg-7">
            {/* Gold accent line */}
            <div
              style={{
                width: 50,
                height: 2,
                background: THEME_CONFIG.gold,
                margin: "0 auto 1.5rem",
              }}
            />
            <h2
              className="font-serif text-white mb-4"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Ready to Transform<br />Your Smile?
            </h2>
            <p
              className="mb-5"
              style={{
                color: "rgba(255,255,255,0.60)",
                fontSize: "1rem",
                maxWidth: 460,
                margin: "0 auto 2rem",
                lineHeight: 1.8,
              }}
            >
              Book your appointment today and experience the Alaya difference. Your journey to a healthier, brighter smile starts here.
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-3">
              <Link href="/book" className="btn-luxury-primary">
                <span>
                  <i className="bi bi-calendar-check me-2"></i>
                  Schedule Your Visit Now
                </span>
              </Link>
              <a
                href="tel:+918848659365"
                className="btn-luxury-outline d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-telephone-fill"></i> Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
interface FooterClinicInfoProps {
  title: string;
  address: string;
}

const FooterClinicInfo = ({ title, address }: FooterClinicInfoProps) => (
  <div className="col-lg-4">
    <div className="footer-heading">{title}</div>
    <ul className="list-unstyled mb-0">
      <li>
        <div className="footer-contact-row">
          <i className="bi bi-geo-alt-fill"></i>
          <span>{address}</span>
        </div>
      </li>
      <li>
        <div className="footer-contact-row">
          <i className="bi bi-telephone-fill"></i>
          <a href="tel:+918848659365" className="footer-link">
            +91 8848659365
          </a>
        </div>
      </li>
      <li>
        <div className="footer-contact-row">
          <i className="bi bi-envelope-fill"></i>
          <a
            href="mailto:alayadentalcare@gmail.com"
            className="footer-link"
          >
            alayadentalcare@gmail.com
          </a>
        </div>
      </li>
      <li>
        <div className="footer-contact-row">
          <i className="bi bi-clock-fill"></i>
          <span>Mon–Sat: 10AM – 8PM</span>
        </div>
      </li>
    </ul>
  </div>
);

const Footer = () => (
  <footer id="contact" className="footer-luxury">
    <div className="container py-5">
      <div className="row g-5">

        {/* Brand */}
        <div className="col-lg-4">
          <div
            className="d-flex align-items-center gap-3 mb-3"
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${THEME_CONFIG.primary}, ${THEME_CONFIG.accent})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className="bi bi-heart-pulse-fill text-white"></i>
            </div>
            <div>
              <div
                className="text-white fw-bold font-serif"
                style={{ fontSize: "1rem" }}
              >
                Alaya Dental Care
              </div>
              <div style={{ fontSize: "0.62rem", color: THEME_CONFIG.gold, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Premium Dental Studio
              </div>
            </div>
          </div>
          <div className="footer-brand-line" />
          <p
            className="mb-4"
            style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.87rem", lineHeight: 1.8 }}
          >
            Making the world smile brighter, one tooth at a time. Experience
            dental care that combines cutting-edge technology with genuine
            compassion.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            {(["facebook", "instagram", "whatsapp", "linkedin"] as const).map(
              (social) => (
                <a
                  key={social}
                  href="#"
                  className="footer-social"
                  aria-label={social}
                >
                  <i className={`bi bi-${social}`}></i>
                </a>
              )
            )}
          </div>
        </div>

        <FooterClinicInfo
          title="Chettiyamkinar Clinic"
          address="Kozhichena Road, Kuttippala, Chettiyamkinar, Kerala 676501"
        />
        <FooterClinicInfo
          title="Kurukathani Clinic"
          address="Kurukathani, Perumanna Klari Gramapanchayat, Kerala 676551"
        />
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom mt-5">
        <div className="row align-items-center g-2">
          <div className="col-md-6 text-center text-md-start">
            © 2026 Alaya Dental Care. All rights reserved.
          </div>
          <div className="col-md-6 text-center text-md-end">
            <a href="#" className="footer-link me-3">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="col-12">
    <div className="loading-luxury">
      <div className="loading-ring" />
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", letterSpacing: "0.5px" }}>
        {message}
      </p>
    </div>
  </div>
);