import { Box } from '@mui/material';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const LOGO_SRC = '/assets/images/ChatGPT_Image_Jul_11__2026__05_15_47_AM-removebg-preview.png';

interface BrandLogoProps {
  height?: number;
  variant?: 'sidebar' | 'auth' | 'navbar';
  clickable?: boolean;
}

export default function BrandLogo({
  height,
  variant = 'sidebar',
  clickable = true,
}: BrandLogoProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const resolvedHeight = height ?? (variant === 'auth' ? 110 : variant === 'navbar' ? 36 : 52);

  const handleClick = () => {
    if (!clickable) return;
    if (user) {
      const dest =
        user.role === 'admin' ? '/admin/dashboard'
          : user.role === 'employee' ? '/employee/dashboard'
            : '/dashboard';
      navigate(dest);
    } else {
      navigate('/');
    }
  };

  const logo = (
    <Box
      component="img"
      src={LOGO_SRC}
      alt="Smart Bank Logo"
      sx={{
        height: { xs: variant === 'auth' ? 85 : variant === 'navbar' ? 32 : 44, sm: resolvedHeight },
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        imageRendering: 'auto',
      }}
    />
  );

  return (
    <Box
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      aria-label="Smart Bank Home"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        '& img': { transition: 'transform 0.25s ease' },
        ...(clickable && { '&:hover img': { transform: 'scale(1.03)' } }),
        ...(variant === 'auth' && {
          animation: 'fadeInLogo 0.5s cubic-bezier(0.22,1,0.36,1) both',
          '@keyFrames fadeInLogo': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }),
      }}
    >
      {logo}
    </Box>
  );
}
