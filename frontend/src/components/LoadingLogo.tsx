import logo from '../assets/fintrack-logo.png';

type LoadingLogoProps = {
  className?: string;
};

function LoadingLogo({ className }: LoadingLogoProps) {
  return (
    <div className={`loading loading-center${className ? ` ${className}` : ''}`}>
      <img src={logo} alt="FinTrack" className="loading-logo" />
    </div>
  );
}

export default LoadingLogo;
