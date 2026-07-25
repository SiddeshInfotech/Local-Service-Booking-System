import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import fixoraLogo from '../assets/images/fixora_logo.png';

const STATUS_CONFIG = {
  success: {
    icon: '✅',
    title: 'Service Marked as Completed!',
    message:
      'Thank you for confirming. Your service completion has been recorded. You can now write a review to help the community.',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e22, #16a34a11)',
  },
  already_done: {
    icon: '✔',
    title: 'Already Confirmed',
    message: 'You have already confirmed this service as completed. No action needed.',
    color: '#D4AF37',
    gradient: 'linear-gradient(135deg, #D4AF3722, #b8960c11)',
  },
  not_found: {
    icon: '❓',
    title: 'Booking Not Found',
    message: 'We could not find a booking matching this link. Please contact support.',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef444422, #dc262611)',
  },
  invalid: {
    icon: '🚫',
    title: 'Invalid Link',
    message: 'This link is invalid or has expired. Please check your confirmation email.',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef444422, #dc262611)',
  },
  error: {
    icon: '⚠️',
    title: 'Something Went Wrong',
    message: 'An error occurred. Please try again later or contact support.',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f9731622, #ea580c11)',
  },
};

const ServiceCompletedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || 'error';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.error;

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={{ ...styles.blob, top: '-80px', left: '-80px', background: '#22c55e18' }} />
      <div style={{ ...styles.blob, bottom: '-60px', right: '-60px', background: '#D4AF3718', animationDelay: '2s' }} />

      <div style={styles.card}>
        {/* Logo */}
        <img src={fixoraLogo} alt="Fixora" style={styles.logo} />

        {/* Status panel */}
        <div style={{ ...styles.statusPanel, background: cfg.gradient, borderColor: cfg.color + '44' }}>
          <span style={styles.icon}>{cfg.icon}</span>
          <h1 style={{ ...styles.title, color: cfg.color }}>{cfg.title}</h1>
          <p style={styles.message}>{cfg.message}</p>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {status === 'success' && (
            <button style={{ ...styles.btn, background: 'linear-gradient(135deg,#F4C542,#D4AF37)', color: '#0D0D0D' }}
              onClick={() => navigate('/')}>
              ⭐ Write a Review
            </button>
          )}
          <button style={{ ...styles.btn, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: '#fff', border: '1px solid #333' }}
            onClick={() => navigate('/')}>
            🏠 Go to Home
          </button>
        </div>

        <p style={styles.footer}>© {new Date().getFullYear()} Fixora – Local Service Booking</p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a14 0%, #111126 50%, #0a0a14 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    filter: 'blur(60px)',
    animation: 'pulse 6s infinite',
    zIndex: 0,
  },
  card: {
    background: 'rgba(22,22,40,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  },
  logo: {
    height: '44px',
    marginBottom: '28px',
    objectFit: 'contain',
  },
  statusPanel: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '28px 24px',
    marginBottom: '28px',
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 10px',
    letterSpacing: '-0.3px',
  },
  message: {
    color: '#AAA',
    fontSize: '14px',
    lineHeight: '1.7',
    margin: 0,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  btn: {
    padding: '13px 24px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    letterSpacing: '0.5px',
    transition: 'opacity 0.2s, transform 0.15s',
    width: '100%',
  },
  footer: {
    color: '#444',
    fontSize: '11px',
    marginTop: '28px',
  },
};

export default ServiceCompletedPage;
