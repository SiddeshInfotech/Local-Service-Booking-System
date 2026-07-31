import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import fixoraLogo from '../assets/images/fixora_logo.png';
import { API_BASE_URL, fetchWithTimeout } from '../api';

const ReviewPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Missing or invalid link.');
      setLoading(false);
      return;
    }

    fetchWithTimeout(`${API_BASE_URL}/api/review/public/${bookingId}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!data.status) throw new Error(data.message || 'Invalid link.');
        if (data.review_given) {
          setSubmitted(true);
        }
        setBookingInfo(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (rating === 0) {
      setFormError('Please select a star rating.');
      return;
    }
    if (!reviewText.trim()) {
      setFormError('Please write a short review.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/api/review/public/${bookingId}?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, review_title: reviewTitle, review_text: reviewText, token }),
        }
      );
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Submission failed.');
      setSubmitted(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render ─── */
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img src={fixoraLogo} alt="Fixora" style={styles.logo} />
          <p style={{ color: '#AAA', marginTop: '20px' }}>Verifying your link…</p>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img src={fixoraLogo} alt="Fixora" style={styles.logo} />
          <div style={{ ...styles.banner, borderColor: '#ef444444', background: '#ef444411' }}>
            <span style={{ fontSize: '36px' }}>🚫</span>
            <h2 style={{ color: '#ef4444', margin: '10px 0 6px' }}>Invalid Link</h2>
            <p style={{ color: '#AAA', fontSize: '13px' }}>{error}</p>
          </div>
          <button style={{ ...styles.btn, marginTop: '20px', background: 'var(--color-hover-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}
            onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img src={fixoraLogo} alt="Fixora" style={styles.logo} />
          <div style={{ ...styles.banner, borderColor: '#22c55e44', background: '#22c55e11' }}>
            <span style={{ fontSize: '48px' }}>⭐</span>
            <h2 style={{ color: '#22c55e', margin: '12px 0 8px' }}>Review Submitted!</h2>
            <p style={{ color: '#AAA', fontSize: '14px', lineHeight: '1.6' }}>
              Thank you for your feedback! Your review helps others find great service providers.
            </p>
          </div>
          <button style={{ ...styles.btn, marginTop: '20px', background: 'var(--color-hover-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}
            onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <div style={styles.page}>
      <div style={{ ...styles.blob, top: '-80px', left: '-80px', background: '#D4AF3714' }} />
      <div style={{ ...styles.blob, bottom: '-60px', right: '-60px', background: '#22c55e10', animationDelay: '2s' }} />

      <div style={styles.card}>
        <img src={fixoraLogo} alt="Fixora" style={styles.logo} />
        <h1 style={styles.heading}>Write a Review</h1>

        {/* Booking Details */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Booking #</span>
            <span style={styles.infoValue}>{bookingInfo?.booking_number}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Service</span>
            <span style={styles.infoValue}>{bookingInfo?.service_name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Provider</span>
            <span style={styles.infoValue}>{bookingInfo?.provider_name}</span>
          </div>
        </div>

        {/* Star Rating */}
        <p style={styles.label}>How would you rate this service?</p>
        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={36}
              fill={star <= displayRating ? '#F4C542' : 'none'}
              stroke={star <= displayRating ? '#F4C542' : '#555'}
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'transform 0.15s', transform: star <= displayRating ? 'scale(1.15)' : 'scale(1)' }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <p style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
          {displayRating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][displayRating] : 'Select a rating'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Review Title */}
          <input
            type="text"
            placeholder="Review title (optional)"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            style={styles.input}
          />

          {/* Review Text */}
          <textarea
            placeholder="Share your experience in detail…"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            required
            style={{ ...styles.input, resize: 'vertical', minHeight: '100px' }}
          />

          {formError && <p style={styles.errorMsg}>⚠ {formError}</p>}

          <button type="submit" disabled={submitting} style={{ ...styles.btn, background: 'linear-gradient(135deg,#F4C542,#D4AF37)', color: '#0D0D0D', marginTop: '6px' }}>
            {submitting ? 'Submitting…' : '⭐ Submit Review'}
          </button>
        </form>

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
    background: 'linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-secondary-bg) 50%, var(--color-primary-bg) 100%)',
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
    zIndex: 0,
  },
  card: {
    background: 'var(--color-card-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '24px',
    padding: '44px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  },
  logo: {
    height: '44px',
    marginBottom: '20px',
    objectFit: 'contain',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    margin: '0 0 20px',
    letterSpacing: '-0.3px',
  },
  infoBox: {
    background: 'var(--color-overlay-subtle)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid var(--color-border-subtle)',
  },
  infoLabel: {
    color: 'var(--color-text-secondary)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    color: 'var(--color-text-primary)',
    fontSize: '13px',
    fontWeight: '500',
  },
  label: {
    color: 'var(--color-text-secondary)',
    fontSize: '13px',
    marginBottom: '10px',
    fontWeight: '500',
  },
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--color-border-subtle)',
    background: 'var(--color-primary-bg)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '13px 24px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    letterSpacing: '0.5px',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '13px',
    marginTop: '10px',
    textAlign: 'left',
  },
  banner: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '28px 20px',
    marginTop: '20px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--color-border-subtle)',
    borderTop: '3px solid var(--color-gold-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto 0',
  },
  footer: {
    color: 'var(--color-text-secondary)',
    fontSize: '11px',
    marginTop: '24px',
  },
};

export default ReviewPage;
