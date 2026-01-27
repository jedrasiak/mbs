import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, showBack = false, actions }: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        {showBack && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            aria-label={t('nav.goBack')}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {actions && <Box>{actions}</Box>}
      </Toolbar>
    </AppBar>
  );
}
