import Blockies from 'react-blockies';
import { styled, useTheme } from '@mui/material/styles';
import { Box, Card, CardHeader, CardContent, Popover, Typography, Button, IconButton } from '@mui/material';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { centerEllipsis, copyToClipboard } from '../utils/strings';
import Iconify from '../components/Iconify';
import { SignOutButton } from './Web3Modal';
import { useAppState } from '../store';
import { getNetworkInfo } from '../config';

export interface AccountProps {
  account: string;
}

const AccountIcon = styled(Blockies)`
  border-radius: 50%;
`;

export const Account = ({ account }: AccountProps) => {
  const theme = useTheme();
  const shortAccount = useMemo(() => centerEllipsis(account || ''), [account]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center'
      }}
      marginRight={theme.spacing(5)}
    >
      <Box marginRight="5px">
        <AccountIcon seed={account} size={7} scale={4} />
      </Box>
      <Box>
        <Typography color="primary" variant="body2">
          {shortAccount}
        </Typography>
      </Box>
    </Box>
  )
};

export const AccountInfo = () => {
  const theme = useTheme();
  const boxRef = useRef<HTMLDivElement>(null);
  const { account, provider } = useAppState();
  const [open, setOpen] = useState<boolean>(false);
  const [explorer, setExplorer] = useState<string | undefined>();
  const connectedWith = useMemo(
    () => provider && provider.provider.isMetaMask ? 'MetaMask' : 'WalletConnect',
    [provider]
  );

  useEffect(
    () => {
      const getExplorer = async () => {
        try {
          if (!provider) {
            setExplorer(undefined);
            return;
          }
          const { chainId } = await provider.getNetwork();
          const { blockExplorer } = getNetworkInfo(chainId);
          setExplorer(blockExplorer);
        } catch (err) {
          //
          setExplorer(undefined);
        }
      };
      getExplorer();
    },
    [provider]
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    if (account) {
      copyToClipboard(account);
    }
  }, [account]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenExplorer  = (type: 'address' | 'tx', value: string) => {
    if (!explorer) {
      return;
    }
    window.open(`${explorer}/${type}/${value}`, '_blank');
  };

  if (!account) {
    return null;
  }

  return (
    <>
      <Box
        ref={boxRef}
        onClick={handleOpen}
        style={{
          cursor: 'pointer'
        }}
      >
        <Account account={account} />
      </Box>
      <Popover
        id="account_control"
        open={open}
        onClose={handleClose}
        anchorEl={boxRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <Card>
          <CardHeader
            title="Account"
            action={<IconButton onClick={handleClose}>
              <Iconify icon="ci:close-big" />
            </IconButton>}
          />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              marginBottom={theme.spacing(2)}
            >
              <Box marginRight={theme.spacing(2)}>
                <Typography>
                  Connected with {connectedWith}
                </Typography>
              </Box>
              <Box>
                <SignOutButton />
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'top',
                justifyContent: 'space-between'
              }}
              marginBottom={theme.spacing(2)}
            >
              <Box marginRight={theme.spacing(2)}>
                <Box>
                  <Account account={account} />
                </Box>
                <Box>
                  <Button
                    endIcon={<Iconify icon="ci:copy" />}
                    onClick={() => copyToClipboard(account)}
                  >
                    Copy address
                  </Button>
                </Box>
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  disabled={explorer === undefined}
                  onClick={() => handleOpenExplorer('address', account)}
                >
                  Open in explorer
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};