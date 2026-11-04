function Brand({ large = false }) {
  return <a className={`brand ${large ? 'brand-large' : ''}`} href="#inicio" aria-label="FitLife início">
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="15" fill="currentColor"/><path d="M10 26h8l5-12 6 22 4-10h5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <span>Fit<span className="brand-light">Life</span><small>UM DIA DE CADA VEZ</small></span>
  </a>;
}
export default Brand;
