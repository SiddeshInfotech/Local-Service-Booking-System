import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Wrench, Snowflake, Hammer, Zap,
  Star, Clock, Calendar, CheckCircle, X, Upload,
  User, Phone, Mail, MapPin, Map,
  Info, ShieldAlert, ClipboardList, Loader2
} from 'lucide-react';
import { API_BASE_URL, apiFetch, getToken, getRole } from '../api';

/* ─── Reliable electrician fallback images (verified working Unsplash URLs) ─── */
const ELECTRICIAN_IMG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop';
const ELECTRICIAN_FALLBACK = 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?q=80&w=600&auto=format&fit=crop';
const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop';

/* Map category names to icons dynamically */
const categoryIcons = {
  'Cleaning': Sparkles,
  'Plumbing': Wrench,
  'AC Repair': Snowflake,
  'Carpenter': Hammer,
  'Electrician': Zap,
};

/* Map category names to colors dynamically */
const categoryColors = {
  'Cleaning': '#60a5fa',
  'Plumbing': '#fb923c',
  'AC Repair': '#34d399',
  'Carpenter': '#f59e0b',
  'Electrician': '#facc15',
};

/* ─── Service Inclusions fallback ─── */
const serviceInclusions = {
  'Cleaning': ['Complete dust vacuuming and sanitization', 'Eco-friendly deep cleaning agents', 'Stain spot treatment on floors & tiles', 'Window pane cleaning & balcony scrubbing', 'Vetted team of 2–3 trained practitioners'],
  'Plumbing': ['Diagnostics and leakage location checks', 'High-grade washers and sealing tapes', 'Blockage extraction with industrial snakes', 'Pressure test validation post repair', '30-day Post-Service Guarantee'],
  'AC Repair': ['Deep filter flushing and condenser coil cleanup', 'Gas pressure diagnostics and minor top-ups', 'Drainage channel leak inspection', 'Ampere check & performance validation', 'Transparent quote for spare components'],
  'Carpenter': ['Bespoke hardware replacement (hinges, locks, slides)', 'Precision alignment and leveling', 'Heavy-duty adhesives and anchors included', 'Wood shaving cleanup and dust disposal', 'Premium finishing touch-up'],
  'Electrician': ['Certified safety audit of local wiring terminal', 'High-durability insulated wiring replacements', 'MCB diagnostics to prevent short circuits', 'Appliance grounding verification', '100% compliance with local electrical safety code'],
};

/* ─── Specific Service Image Mapping ─── */
const getServiceImgUrl = (serviceName, catName) => {
  if (!serviceName) return null;
  const name = serviceName.toLowerCase();

  // Electrician
  if (name.includes('wiring')) return 'https://daganghalal.blob.core.windows.net/28781/Product/1000x1000__electricalwiring-1658284853886.png';
  if (name.includes('fan')) return 'https://cheselectric.com/wp-content/uploads/2024/02/Installing-a-ceiling-fan.jpg';
  if (name.includes('switchboard')) return 'https://img.freepik.com/premium-photo/troubleshooting-repair-wiring-electrical-switchboard-panel-concept-electrical-wiring-switchboard-panel-troubleshooting-repair-electrical-maintenance_918839-271381.jpg?w=1380';
  if (name.includes('light')) return 'https://images.unsplash.com/photo-1557992260-ec58e38d363c?q=80&w=700&auto=format&fit=crop';
  if (name.includes('socket')) return 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=700&auto=format&fit=crop';

  // Plumber
  if (name.includes('pipe')) return 'https://as2.ftcdn.net/v2/jpg/09/76/88/19/1000_F_976881955_xArYzrnjaWVbGcr6lZ17nfCcCNmdJ5YO.jpg';
  if (name.toLowerCase().includes('bathroom')) { return 'https://plumbingrenewal.com/wp-content/uploads/2025/12/Bathroom-Plumbing-Emergencies.jpg'; }
  if (name.includes('drain')) return 'https://greaseremove.com/wp-content/uploads/2026/03/hydrojet-drain-cleaning-process.webp';
  if (name.includes('leak')) return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=700&auto=format&fit=crop';
  if (name.includes('tank')) return 'https://images.unsplash.com/photo-1527334134460-f21a05ef62f3?q=80&w=700&auto=format&fit=crop';
  if (name.includes('water') && catName === 'Plumbing') return 'https://zeve.au/fixedtoday/uploads/2022/08/plumber-working-on-commercial-plumbing.jpg';

  // Carpenter
  if (name.includes('furniture')) return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=700&auto=format&fit=crop';
  if (name.includes('door')) return 'https://bostoncommercialdoorsystems.com/wp-content/uploads/2025/10/Door-Frame-Repair-4.jpg';
  if (name.includes('window')) return 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=700&auto=format&fit=crop';
  if (name.includes('cabinet')) return 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?q=80&w=700&auto=format&fit=crop';
  if (name.includes('shelf') || name.includes('shelv')) return 'https://images.unsplash.com/photo-1497367664687-f8319baee20e?q=80&w=700&auto=format&fit=crop';

  // Painter
  if (name.includes('interior')) return 'https://images.livspace-cdn.com/w:3840/plain/https://d3gq2merok8n5r.cloudfront.net/abhinav/ond-1634120396-Obfdc/ond-2024-1727950725-vfT46/living-1728890772-3eAJ0/04-1-1-1732692422-rfW1C.jpg';
  if (name.includes('exterior')) return 'https://5.imimg.com/data5/SELLER/Default/2023/2/FR/OO/DC/54228267/exterior-painting-service-1000x1000.jpg';
  if (name.includes('texture')) return 'https://images.unsplash.com/photo-1563842137996-039c3a372134?q=80&w=700&auto=format&fit=crop';
  if (name.includes('waterproof')) return 'https://images.unsplash.com/photo-1588874020942-0f04746f3453?q=80&w=700&auto=format&fit=crop';
  if (name.includes('paint')) return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=700&auto=format&fit=crop';

  // Cleaner
  if (name.includes('deep clean') || name.includes('home clean') || name.includes('deep')) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=700&auto=format&fit=crop';
  if (name.includes('office')) return 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=700&auto=format&fit=crop';
  if (name.includes('kitchen')) return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=700&auto=format&fit=crop';
  if (name.includes('bathroom') && catName === 'Cleaning') return 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=700&auto=format&fit=crop';
  if (name.includes('sofa')) return 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?q=80&w=700&auto=format&fit=crop';
  if (name.includes('clean')) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=700&auto=format&fit=crop';

  // Mechanic
  if (name.includes('bike') || name.includes('motorcycle')) return 'https://b1944490.smushcdn.com/1944490/wp-content/uploads/sites/46/2022/11/Copy-of-Main_0001_0001.jpg?lossy=2&strip=1&webp=1p';
  if (name.includes('car')) return 'https://www.avalonvehiclesolutions.co.uk/_next/image?url=%2Fimages%2Fhero-car-servicing.jpg&w=3840&q=75&dpl=dpl_GAa9HQeBEiuqKiDzSXPjJXUbh1Tf';
  if (name.includes('engine')) return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=700&auto=format&fit=crop';
  if (name.includes('oil')) return 'https://images.unsplash.com/photo-1621373516086-4fc642642d99?q=80&w=700&auto=format&fit=crop';
  if (catName === 'Mechanic') return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=700&auto=format&fit=crop';

  // AC Repair
  if (name.includes('install') && catName === 'AC Repair') return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=700&auto=format&fit=crop';
  if (name.includes('gas') || name.includes('refill')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=700&auto=format&fit=crop';
  if (name.includes('servic')) return 'https://kolkataservicepoint.com/images/ac-01.png';
  if (name.includes('repair') && catName === 'AC Repair') return 'https://kolkataservicepoint.com/images/ac-01.png';

  // Appliance Repair
  if (name.includes('washing')) return 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=700&auto=format&fit=crop';
  if (name.includes('refrigerator') || name.includes('fridge')) return 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=700&auto=format&fit=crop';
  if (name.includes('microwave') || name.includes('oven')) return 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?q=80&w=700&auto=format&fit=crop';
  if (name.includes('tv') || name.includes('television')) return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=700&auto=format&fit=crop';
  if (name.includes('purifier') || name.includes('ro')) return 'https://images.unsplash.com/photo-1579730598818-a6b68b375b42?q=80&w=700&auto=format&fit=crop';

  return null;
};

/* ─── Intersection Observer hook ─── */
const useInView = (threshold = 0.12) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ─── Animated Section ─── */
const AnimSection = ({ children, className = '', delay = 0, dir = 'up' }) => {
  const [ref, inView] = useInView();
  const hidden = {
    up: 'opacity-0 translate-y-10',
    left: 'opacity-0 -translate-x-8',
    right: 'opacity-0 translate-x-8',
    scale: 'opacity-0 scale-95',
  }[dir] || 'opacity-0 translate-y-10';
  return (
    <div ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

/* ─── Ripple Button ─── */
const RippleBtn = ({ children, className = '', onClick, type = 'button', disabled = false }) => {
  const ref = useRef(null);
  const fire = (e) => {
    const btn = ref.current;
    if (!btn) return;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    const r = d / 2;
    const rect = btn.getBoundingClientRect();
    Object.assign(circle.style, {
      position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
      width: `${d}px`, height: `${d}px`,
      left: `${e.clientX - rect.left - r}px`,
      top: `${e.clientY - rect.top - r}px`,
      background: 'rgba(255,255,255,0.22)',
      transform: 'scale(0)', animation: 'ripple-anim 0.6s linear',
    });
    circle.className = 'ripple-circle';
    const old = btn.querySelector('.ripple-circle');
    if (old) old.remove();
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 650);
    if (onClick) onClick(e);
  };
  return (
    <button ref={ref} type={type} disabled={disabled} className={`relative overflow-hidden ${className}`} onClick={fire}>
      {children}
    </button>
  );
};

/* ─── Services Page Component ─── */
const ServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successBooking, setSuccessBooking] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailService, setDetailService] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Dynamic lists from backend
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [serviceOptions, setServiceOptions] = useState({});
  const [loading, setLoading] = useState(true);

  // Mouse parallax for hero
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    setMouse({
      x: (e.clientX - window.innerWidth / 2) / 55,
      y: (e.clientY - window.innerHeight / 2) / 55,
    });
  };

  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', address: '', city: '',
    category: '', subService: '', date: '', time: '', problemDesc: '',
  });

  // Fetch initial services & categories
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/category`),
        fetch(`${API_BASE_URL}/api/service`)
      ]);
      const catData = await catRes.json();
      const srvData = await srvRes.json();

      let fetchedCats = [];
      let fetchedSrvs = [];

      if (catRes.ok && catData.status) {
        fetchedCats = catData.categories || [];
        setCategoriesList(fetchedCats);
      }
      if (srvRes.ok && srvData.status) {
        fetchedSrvs = srvData.services || [];
        setServicesList(fetchedSrvs);
      }

      // Build options map for booking subService selectors
      const options = {};
      fetchedCats.forEach(cat => {
        options[cat.category_name] = fetchedSrvs
          .filter(s => s.category_id === cat.category_id)
          .map(s => s.service_name);
      });
      setServiceOptions(options);

    } catch {
      // Fallback notifications not required here
    } finally {
      setLoading(false);
    }
  };

  // Pre-load user profile if logged in
  const loadUserProfile = async () => {
    const token = getToken();
    const role = getRole();
    if (token && role === 'customer') {
      try {
        const res = await apiFetch('/api/customer/profile');
        const data = await res.json();
        if (res.ok && data.status && data.customer) {
          const c = data.customer;
          setFormData(prev => ({
            ...prev,
            name: c.full_name || '',
            email: c.email || '',
            mobile: c.phone || '',
            address: c.address || '',
            city: c.city || ''
          }));
        }
      } catch {
        // Fail silently
      }
    }
  };

  useEffect(() => {
    loadInitialData();
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (location.state?.category) setActiveCategoryTab(location.state.category);
  }, [location.state]);

  const openBookingModal = (service) => {
    const token = getToken();
    const role = getRole();
    if (!token || role !== 'customer') {
      alert('Please log in as a Customer to book a service.');
      navigate('/customer/login');
      return;
    }
    setSelectedService(service);
    setFormData(prev => ({
      ...prev,
      category: service.category,
      subService: serviceOptions[service.category]?.[0] || ''
    }));
    setBookingOpen(true);
  };

  const openDetailModal = (service) => {
    setDetailService(service);
    setDetailOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subService: serviceOptions[value]?.[0] || '' }));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    // 1. Locate selected Category & Service ID
    const catObj = categoriesList.find(c => c.category_name === formData.category);
    if (!catObj) {
      alert('Error mapping service category.');
      return;
    }

    const srvObj = servicesList.find(s => s.service_name === formData.subService && s.category_id === catObj.category_id);
    if (!srvObj) {
      alert('Selected service not found in registry database.');
      return;
    }

    setSubmittingBooking(true);
    try {
      // 2. Fetch approved providers for this category to allocate one
      const provRes = await fetch(`${API_BASE_URL}/api/provider?category_id=${catObj.category_id}`);
      const provData = await provRes.json();
      let providerId = null;

      if (provRes.ok && provData.status && provData.providers && provData.providers.length > 0) {
        // Pick first approved provider matching city if possible, else just pick first provider
        const matched = provData.providers.find(p => (p.city || '').toLowerCase() === (formData.city || '').toLowerCase()) || provData.providers[0];
        providerId = matched.provider_id;
      }

      if (!providerId) {
        alert('No registered service providers are currently available for this category. Please try again later.');
        setSubmittingBooking(false);
        return;
      }

      // 3. Create the booking entry
      const res = await apiFetch('/api/booking', {
        method: 'POST',
        body: JSON.stringify({
          provider_id: providerId,
          service_id: srvObj.service_id,
          booking_date: formData.date,
          booking_time: formData.time,
          service_address: formData.address,
          city: formData.city,
          state: 'State',
          pincode: '000000',
          problem_description: formData.problemDesc || 'No details provided.',
          // Pass form-entered details so confirmation email goes to the right address
          customer_name: formData.name,
          customer_email: formData.email,
          customer_mobile: formData.mobile,
          category: formData.category
        })
      });

      const data = await res.json();
      if (res.ok && data.status) {
        setSuccessBooking(true);
        setTimeout(() => {
          setBookingOpen(false);
          setSuccessBooking(false);
          setFormData(prev => ({
            ...prev,
            problemDesc: '',
            date: '',
            time: ''
          }));
        }, 4000);
      } else {
        alert(data.message || 'Failed to submit booking. Check slot details.');
      }

    } catch {
      alert('Network error. Unable to register booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const categories = ['All', ...categoriesList.map(c => c.category_name)];

  // Transform services list from backend to match frontend cards structure
  const mappedServicesList = servicesList.map(s => {
    const cat = categoriesList.find(c => c.category_id === s.category_id);
    const catName = cat ? cat.category_name : 'General';
    return {
      id: s.service_id,
      category: catName,
      icon: categoryIcons[catName] || Sparkles,
      title: s.service_name,
      desc: s.description || 'Professional, verified tasks rendered at your local doorstep.',
      price: s.estimated_price != null ? `₹${s.estimated_price}` : '₹299',
      duration: s.estimated_duration || '1-2 Hrs',
      availability: 'Mon - Sun',
      rating: '4.8',
      reviewsCount: '150',
      imgUrl: getServiceImgUrl(s.service_name, catName) || (
        catName === 'Cleaning' ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=700&auto=format&fit=crop' :
          catName === 'Plumbing' ? 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=700&auto=format&fit=crop' :
            catName === 'AC Repair' ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=700&auto=format&fit=crop' :
              catName === 'Carpenter' ? 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=700&auto=format&fit=crop' :
                ELECTRICIAN_IMG
      ),
      fallbackImgUrl: ELECTRICIAN_FALLBACK,
      accentColor: categoryColors[catName] || '#60a5fa'
    };
  });

  const filteredServices = activeCategoryTab === 'All'
    ? mappedServicesList
    : mappedServicesList.filter(s => s.category === activeCategoryTab);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[var(--color-primary-bg)] text-[var(--color-text-primary)] selection:bg-[#D4AF37]/30 selection:text-[var(--color-text-primary)] font-sans relative overflow-x-hidden"
    >

      {/* ─── Global Styles ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }

        /* Ripple */
        @keyframes ripple-anim { to { transform: scale(4); opacity: 0; } }

        /* Gold shimmer text */
        .svc-gold-shimmer {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 30%, #FFF9E0 50%, #FFE89C 70%, #D4AF37 100%);
          background-size: 250% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: svcGoldShimmer 5s linear infinite;
        }
        @keyframes svcGoldShimmer {
          0% { background-position: -250% center; }
          100% { background-position: 250% center; }
        }

        /* Gold text static gradient */
        .gold-text-gradient {
          background: linear-gradient(135deg, #FFE89C 0%, #D4AF37 50%, #9B8227 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* Glass panel */
        .glass-panel {
          background: var(--color-card-bg);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(212,175,55,0.13);
        }

        /* Card hover */
        .svc-card {
          border: 1px solid rgba(212,175,55,0.18);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
          transition: all 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .svc-card:hover {
          border-color: rgba(212,175,55,0.6);
          box-shadow: 0 8px 40px rgba(212,175,55,0.2), 0 0 0 1px rgba(212,175,55,0.12), inset 0 0 20px rgba(212,175,55,0.03);
          transform: translateY(-10px);
        }

        /* Light sweep on hover */
        .light-sweep { position: relative; overflow: hidden; }
        .light-sweep::before {
          content: '';
          position: absolute; top: 0; left: -75%; width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent 30%, rgba(212,175,55,0.07) 50%, transparent 70%);
          transform: skewX(-15deg); pointer-events: none; z-index: 15;
          transition: left 0s;
        }
        .light-sweep:hover::before { left: 150%; transition: left 0.75s ease; }

        /* Gold fill btn */
        .gold-btn {
          background: linear-gradient(135deg, #F4C542 0%, #D4AF37 55%, #BCA032 100%);
          color: #0D0D0D; font-weight: 800;
          box-shadow: 0 4px 20px rgba(212,175,55,0.25);
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .gold-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 35px rgba(212,175,55,0.5);
          background: linear-gradient(135deg, #FFE89C 0%, #F4C542 55%, #D4AF37 100%);
        }
        .gold-btn:active { transform: translateY(-1px); }

        /* Shimmer gold btn animation */
        .gold-shimmer-btn {
          background: linear-gradient(90deg, #D4AF37 0%, #FFE89C 25%, #D4AF37 50%, #BCA032 75%, #D4AF37 100%);
          background-size: 300% auto; animation: shimBtn 3.5s linear infinite;
          color: #0D0D0D; font-weight: 800;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .gold-shimmer-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 35px rgba(212,175,55,0.5);
        }
        @keyframes shimBtn { 0% { background-position: 0% center; } 100% { background-position: 300% center; } }

        /* Outline btn */
        .outline-gold-btn {
          background: transparent;
          border: 1.5px solid rgba(212,175,55,0.45);
          color: #D4AF37; font-weight: 700;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .outline-gold-btn:hover {
          background: rgba(212,175,55,0.08);
          border-color: #D4AF37;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,175,55,0.15);
        }

        /* Success checkmark */
        @keyframes checkmarkScale {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-checkmark { animation: checkmarkScale 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        /* Sparkle */
        @keyframes sparkFlow {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.85; }
          100% { transform: translateY(-130px) scale(0.15); opacity: 0; }
        }
        .sparkle-particle {
          position: absolute; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, #FFE89C 0%, #D4AF37 70%, transparent 100%);
        }

        /* Dot pulse */
        .pulse-dot { animation: dotPulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
        }

        /* Ken Burns video */
        @keyframes heroZoom { 0%,100% { transform: scale(1.04); } 50% { transform: scale(1.1); } }
        .hero-video-zoom { animation: heroZoom 28s ease-in-out infinite; }

        /* Page vignette */
        .page-vignette {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.5) 100%);
          pointer-events: none; z-index: 9998;
        }

        /* Image hover scale */
        .img-hover { transition: transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .svc-card:hover .img-hover { transform: scale(1.07); }

        /* Input focus */
        .form-input {
          background: var(--color-secondary-bg);
          border: 1px solid rgba(212,175,55,0.22);
          transition: all 0.3s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
        }

        /* Select dark */
        select option { background: var(--color-primary-bg); color: var(--color-text-primary); }

        /* Fade-in animation */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-slide-up { animation: fadeSlideUp 0.45s ease both; }
      `}</style>

      {/* Page vignette */}
      <div className="page-vignette" />

      {/* ══════════════ HERO BANNER ══════════════ */}
      <section className="relative min-h-[52vh] sm:min-h-[58vh] flex items-end justify-center pt-28 pb-16 overflow-hidden">
        {/* BG Image with ken burns */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 hero-video-zoom brightness-[0.22] saturate-[0.8]"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1800&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-bg)] via-[var(--color-primary-bg)]/40 to-[var(--color-primary-bg)]/55 z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <AnimSection dir="up" delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-[#D4AF37]/22 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] pulse-dot" />
              <span className="text-[10px] sm:text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Our Premium Services</span>
            </div>
          </AnimSection>
          <AnimSection dir="up" delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-5 text-[var(--color-text-primary)] leading-[1.08]">
              Exquisite Solutions For<br />
              <span className="svc-gold-shimmer">Every Household Task</span>
            </h1>
          </AnimSection>
          <AnimSection dir="up" delay={200}>
            <p className="text-[var(--color-text-secondary)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-7">
              Certified, vetted practitioners who bring tools, experience, and supreme quality right to your doorstep. Choose from our curated service menu below.
            </p>
          </AnimSection>
          <AnimSection dir="up" delay={300}>
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-2 bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-full text-xs text-[var(--color-text-primary)]">
                <span className="text-[#D4AF37]">✔</span> Vetted Professionals
              </div>
              <div className="flex items-center gap-2 bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-full text-xs text-[var(--color-text-primary)]">
                <span className="text-[#D4AF37]">⚡</span> &lt; 30 Min Response
              </div>
              <div className="flex items-center gap-2 bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-full text-xs text-[var(--color-text-primary)]">
                <span className="text-[#D4AF37]">🔒</span> Secure Booking
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══════════════ SERVICES GRID ══════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Category Tabs */}
        {loading ? (
          <div className="flex justify-center mb-14">
            <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
          </div>
        ) : (
          <AnimSection dir="up">
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-14">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${activeCategoryTab === cat
                    ? 'gold-btn shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-[var(--color-secondary-bg)]/80 border border-[#D4AF37]/15 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[#D4AF37]/45 hover:bg-[var(--color-secondary-bg)]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </AnimSection>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {!loading && filteredServices.map((svc, i) => {
            const IconComponent = svc.icon;
            return (
              <AnimSection key={svc.id} dir="up" delay={i * 75} className="h-full">
                <div className="svc-card glass-panel rounded-[32px] overflow-hidden flex flex-col h-full group light-sweep text-left">

                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-bg)] via-[var(--color-card-bg)]/10 to-transparent z-[2]" />
                    <img
                      src={svc.imgUrl}
                      alt={svc.title}
                      onError={(e) => {
                        if (svc.fallbackImgUrl && e.target.src !== svc.fallbackImgUrl) {
                          e.target.src = svc.fallbackImgUrl;
                        } else if (e.target.src !== GENERIC_FALLBACK) {
                          e.target.src = GENERIC_FALLBACK;
                        }
                      }}
                      loading="lazy"
                      className="img-hover w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]"
                      style={{ background: `radial-gradient(ellipse at center, ${svc.accentColor}08 0%, transparent 70%)` }} />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4 z-10 bg-[var(--color-modal-overlay)] backdrop-blur-md border border-[#D4AF37]/22 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                      <IconComponent size={13} className="text-[#D4AF37]" />
                      <span className="text-[10px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">{svc.category}</span>
                    </div>
                    {/* Rating badge */}
                    <div className="absolute top-4 right-4 z-10 bg-[#D4AF37]/12 backdrop-blur-md border border-[#D4AF37]/32 px-3.5 py-1.5 rounded-full flex items-center gap-1">
                      <Star size={11} className="text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-[10px] font-bold text-[#D4AF37]">{svc.rating}</span>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-7 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2.5 group-hover:text-[#D4AF37] transition-colors duration-300">
                      {svc.title}
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed mb-5 flex-grow">
                      {svc.desc}
                    </p>

                    {/* Metadata */}
                    <div className="border-t border-[#D4AF37]/10 pt-4 space-y-3 mb-5 text-xs text-[var(--color-text-primary)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-text-secondary)]">Duration</span>
                        <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                          <Clock size={12} className="text-[#D4AF37]" /> {svc.duration}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-text-secondary)]">Availability</span>
                        <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                          <Calendar size={12} className="text-[#D4AF37]" /> {svc.availability}
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-end border-b border-[var(--color-border-subtle)] pb-3.5 mb-4">
                        <div>
                          <p className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-semibold mb-0.5">Starting From</p>
                          <p className="text-2xl font-black text-[#D4AF37]">{svc.price}</p>
                        </div>
                        <span className="text-[10px] text-[var(--color-text-secondary)] italic pb-1">Pre-vetted rates</span>
                      </div>

                      <div className="flex gap-3">
                        <RippleBtn
                          onClick={() => openBookingModal(svc)}
                          className="gold-shimmer-btn flex-1 py-3 rounded-full text-xs font-black tracking-wider uppercase cursor-pointer"
                        >
                          Book Now
                        </RippleBtn>
                        <RippleBtn
                          onClick={() => openDetailModal(svc)}
                          className="outline-gold-btn flex-1 py-3 rounded-full text-xs font-black tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Learn More</span>
                          <Info size={12} />
                        </RippleBtn>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimSection>
            );
          })}
        </div>

        {/* Empty state */}
        {!loading && filteredServices.length === 0 && (
          <div className="text-center py-20 text-[var(--color-text-secondary)]">
            <p className="text-lg font-semibold mb-2">No services found</p>
            <p className="text-sm">Try selecting a different category.</p>
          </div>
        )}
      </section>

      {/* ══════════════ LEARN MORE DETAIL MODAL ══════════════ */}
      {detailOpen && detailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDetailOpen(false)}
            className="absolute inset-0 bg-[var(--color-modal-overlay)] backdrop-blur-2xl" />

          <div className="relative glass-panel rounded-[36px] border border-[#D4AF37]/25 w-full max-w-lg overflow-hidden shadow-2xl shadow-[var(--theme-glass-shadow-1)] fade-slide-up z-10 p-8 space-y-6 text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest border border-[#D4AF37]/25 px-3 py-1 rounded-full">Service Details</span>
                <h3 className="text-2xl font-black text-[var(--color-text-primary)] mt-3">{detailService.title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Star size={13} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm text-[#D4AF37] font-bold">{detailService.rating}</span>
                  <span className="text-[var(--color-text-secondary)] text-xs">({detailService.reviewsCount} reviews)</span>
                </div>
              </div>
              <button onClick={() => setDetailOpen(false)}
                className="w-9 h-9 rounded-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center hover:bg-[var(--color-overlay-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Inclusions */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList size={14} className="text-[#D4AF37]" /> What is Included
              </h4>
              <ul className="space-y-2.5">
                {(serviceInclusions[detailService.category] || ['Standard safety inspections', 'Full tools setup and cleanup', 'Premium components checking', 'Diagnostics checklist verification']).map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-[#D4AF37] font-black mt-0.5 text-base leading-none">✓</span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety note */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/18 flex gap-3 text-xs text-amber-500/90 leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Important Guidelines</p>
                <p>Ensure power and water supply are accessible before arrival. Free cancellations up to 2 hours before the booking.</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 pt-1">
              <RippleBtn onClick={() => setDetailOpen(false)} className="outline-gold-btn flex-1 py-3 rounded-full text-xs font-bold cursor-pointer">
                Close Info
              </RippleBtn>
              <RippleBtn
                onClick={() => { setDetailOpen(false); openBookingModal(detailService); }}
                className="gold-btn flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Book This Service
              </RippleBtn>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ BOOKING MODAL ══════════════ */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !successBooking && !submittingBooking && setBookingOpen(false)}
            className="absolute inset-0 bg-[var(--color-modal-overlay)] backdrop-blur-2xl" />

          <div className="relative glass-panel rounded-[36px] border border-[#D4AF37]/25 w-full max-w-2xl overflow-hidden shadow-2xl shadow-[var(--theme-glass-shadow-1)] max-h-[92vh] flex flex-col fade-slide-up z-10 text-left">

            {/* Success overlay */}
            {successBooking && (
              <div className="absolute inset-0 bg-[var(--color-primary-bg)]/98 flex flex-col items-center justify-center z-50 p-8 text-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="sparkle-particle"
                      style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 7 + 2}px`, height: `${Math.random() * 7 + 2}px`,
                        animation: `sparkFlow ${Math.random() * 2 + 2.5}s linear infinite`,
                        animationDelay: `${Math.random() * 1.5}s`
                      }} />
                  ))}
                </div>
                <div className="w-24 h-24 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/35 flex items-center justify-center mb-6 animate-checkmark">
                  <CheckCircle size={56} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-3xl font-black mb-3 text-[var(--color-text-primary)]">Booking Confirmed!</h2>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-md leading-relaxed mb-6">
                  Your booking has been submitted. A Fixora certified expert will contact you shortly to confirm the schedule.
                </p>
                <div className="text-[#D4AF37] font-semibold text-xs tracking-wider uppercase border border-[#D4AF37]/22 bg-[#D4AF37]/5 px-5 py-2.5 rounded-full">
                  Preparing your schedule…
                </div>
              </div>
            )}

            {/* Header */}
            <div className="px-8 py-6 border-b border-[#D4AF37]/15 flex items-center justify-between bg-[var(--color-secondary-bg)]/90 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-[var(--color-text-primary)]">
                  Schedule <span className="gold-text-gradient">Your Booking</span>
                </h2>
                <p className="text-[var(--color-text-secondary)] text-xs mt-1">Vetted professionals at your fingertips</p>
              </div>
              <button onClick={() => setBookingOpen(false)}
                className="w-9 h-9 rounded-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center hover:bg-[var(--color-overlay-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="flex-grow overflow-y-auto p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <User size={12} className="text-[#D4AF37]" /> Full Name
                  </label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={12} className="text-[#D4AF37]" /> Mobile Number
                  </label>
                  <input type="tel" name="mobile" required value={formData.mobile} onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} className="text-[#D4AF37]" /> Email Address
                </label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#D4AF37]" /> Address
                  </label>
                  <input type="text" name="address" required value={formData.address} onChange={handleInputChange}
                    placeholder="House No, Street, Landmark"
                    className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Map size={12} className="text-[#D4AF37]" /> City
                  </label>
                  <input type="text" name="city" required value={formData.city} onChange={handleInputChange}
                    placeholder="City"
                    className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">Service Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}
                    className="form-input w-full bg-[var(--color-secondary-bg)] rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] cursor-pointer">
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">Specific Service</label>
                  <select name="subService" value={formData.subService} onChange={handleInputChange}
                    className="form-input w-full bg-[var(--color-secondary-bg)] rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] cursor-pointer">
                    {serviceOptions[formData.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">Preferred Date</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleInputChange}
                    className="form-input w-full bg-[var(--color-secondary-bg)] rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">Time Slot</label>
                  <select name="time" required value={formData.time} onChange={handleInputChange}
                    className="form-input w-full bg-[var(--color-secondary-bg)] rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] cursor-pointer">
                    <option value="">Choose a Slot</option>
                    <option value="08:00 AM - 11:00 AM">08:00 AM – 11:00 AM (Morning)</option>
                    <option value="11:00 AM - 02:00 PM">11:00 AM – 02:00 PM (Midday)</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM – 05:00 PM (Afternoon)</option>
                    <option value="05:00 PM - 08:00 PM">05:00 PM – 08:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">Explain the Problem</label>
                <textarea name="problemDesc" rows="3" required value={formData.problemDesc} onChange={handleInputChange}
                  placeholder="Describe what you need help with (e.g. leaky faucet, AC not cooling, wiring issue…)"
                  className="form-input w-full rounded-xl px-4 py-3.5 text-xs text-[var(--color-text-primary)] placeholder-zinc-600 resize-none" />
              </div>
            </form>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#D4AF37]/15 flex justify-end gap-3 bg-[var(--color-secondary-bg)]/90 flex-shrink-0">
              <RippleBtn disabled={submittingBooking} onClick={() => setBookingOpen(false)} className="outline-gold-btn px-6 py-3 rounded-full text-xs cursor-pointer">
                Cancel
              </RippleBtn>
              <RippleBtn disabled={submittingBooking} onClick={handleBookingSubmit} className="gold-btn px-8 py-3 rounded-full text-xs uppercase tracking-wider font-bold cursor-pointer flex items-center gap-2">
                {submittingBooking && <Loader2 size={12} className="animate-spin" />}
                Confirm Booking
              </RippleBtn>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesPage;
