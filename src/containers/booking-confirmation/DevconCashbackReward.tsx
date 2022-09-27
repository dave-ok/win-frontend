import {Client} from "@tokenscript/token-negotiator";
import "@tokenscript/token-negotiator/dist/theme/style.css";
import {Box, Button, Card, Container, Modal, Stack, styled, Typography, useTheme} from "@mui/material";
import Image from "../../components/Image";
import {LoadingButton} from "@mui/lab";
import {useEffect, useState} from "react";
import process from "process";
import {useAppState} from "../../store";
import stlLogo from "../../images/stl/stl-logo.png";
import emailIcon from "../../images/stl/email-icon.png";
import tickIcon from "../../images/stl/tick-icon.png";
import errorIcon from "../../images/stl/error-icon.png";

const ContainerStyle = styled(Container)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius
}));

declare global {
  interface Window {
    negotiator: Client
  }
}

export const DevconCashbackReward = () => {

  const { provider } = useAppState();

  const theme = useTheme();
  const paddingContainer = theme.spacing(3);

  const [modalMode, setModalMode] = useState(0);
  const [ticket, setTicket] = useState(null);

  const [error, setError] = useState({message: "", detail: ""});

  const AUTH_ERROR_STR = "There was an error during Authentication. Please refer to the error message below for more details: ";

  useEffect(() => {
    window.negotiator = new Client({
      type: "active",
      uiOptions: {
        openingHeading: "Validate your Devcon ticket ownership to apply for cashback",
        issuerHeading: "Your tickets"
      },
      issuers: [
        {
          "collectionID": "devcon",
          "onChain": false,
          "title": "Devcon Test Ticket",
          "image": "https://raw.githubusercontent.com/TokenScript/token-negotiator/main/mock-images/devcon.svg",
          "tokenOrigin": "https://stltesting.tk/token-outlet/",
          "unEndPoint": "https://crypto-verify.herokuapp.com/use-devcon-ticket",
          "base64senderPublicKeys": {
            "6": "MIIBMzCB7AYHKoZIzj0CATCB4AIBATAsBgcqhkjOPQEBAiEA/////////////////////////////////////v///C8wRAQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBEEEeb5mfvncu6xVoGKVzocLBwKb/NstzijZWfKBWxb4F5hIOtp3JqPEZV2k+/wOEQio/Re0SKaFVBmcR9CP+xDUuAIhAP////////////////////66rtzmr0igO7/SXozQNkFBAgEBA0IABGMxHraqggr2keTXszIcchTjYjH5WXpDaBOYgXva82mKcGnKgGRORXSmcjWN2suUCMkLQj3UNlZCFWF10wIrrlw="
          },
          "base64attestorPubKey": "MIIBMzCB7AYHKoZIzj0CATCB4AIBATAsBgcqhkjOPQEBAiEA/////////////////////////////////////v///C8wRAQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBEEEeb5mfvncu6xVoGKVzocLBwKb/NstzijZWfKBWxb4F5hIOtp3JqPEZV2k+/wOEQio/Re0SKaFVBmcR9CP+xDUuAIhAP////////////////////66rtzmr0igO7/SXozQNkFBAgEBA0IABL+y43T1OJFScEep69/yTqpqnV/jzONz9Sp4TEHyAJ7IPN9+GHweCX1hT4OFxt152sBN3jJc1s0Ymzd8pNGZNoQ="
        }
      ]
    });

    window.negotiator.on("tokens-selected", (tokens) => {

      if (tokens.selectedTokens?.["devcon"]?.tokens?.length > 0){
        setModalMode(1);
        setTicket(tokens.selectedTokens["devcon"]?.tokens[0]);
      } else {
        showError("Looks like you don't have Devcon tickets, ensure you have opened your Devcon magic link in this browser.", "");
      }
    });

    window.negotiator.on("token-proof", (proof: any) => {
      if (proof.error){
        showError(AUTH_ERROR_STR, proof.error);
        return;
      }
      sendCashbackRequest(proof.data);
    });
  });

  async function sendCashbackRequest(data: any){

    try {

      const params = new URLSearchParams(document.location.search);

      const chainId = provider?.network.chainId.toString();

      const res = await fetch("https://attestation-verify.tokenscript.org/attestation-verification", {
        method: "POST",
        headers: [
          ["Content-Type", "application/json"]
        ],
        body: JSON.stringify({
          perkId: "windingTree",
          useTicket: data.proof,
          un: data.useEthKey,
          address: data.useEthKey.address,
          chainId: chainId ?? "-1",
          requestData: {
            offerId: params.get("offerId"),
            transactionHash: params.get("tx")
          }
        })
      });

      if (res.status < 200 || res.status > 299){
        const body = await res.text();

        throw new Error("Attestation validation failed: " + (body ? body : res.statusText));
      }

    } catch (e){
      showError(AUTH_ERROR_STR, e.message);
      return;
    }

    setModalMode(2);
  }

  function showError(message: string, detail: string){
    setError({message: message, detail: detail});
    setModalMode(3);
  }

  return (
    <>
      {process.env.REACT_APP_STL_DEVCON &&
      document.location.hash === "#devcon" &&
      <>
        <Card
          elevation={5}
          sx={{
            p: paddingContainer,
            position: 'relative',
            marginBottom: '50px'
          }}
        >
          <Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }}>
              <Stack direction="column" mb={2}  alignItems={{ xs: 'center', sm: 'left' }}>
                <Image src={stlLogo} sx={{width: '150px', height: 'auto'}} padding="20px"/>
              </Stack>
              <Stack direction="column" mb={2} alignItems="left">
                <Typography variant="h4" component="h3" mt={2} style={{marginBottom: '20px'}}>
                  Claim $50 Cashback using BrandConnector
                </Typography>
                <ul style={{marginBottom: '10px'}}>
                  <li>Limited to 100 users</li>
                  <li>$50 USD max</li>
                </ul>
                <small>Read more about BrandConnector <a href="https://brandconnector.io/" target="_blank" rel="noreferrer">here</a></small>
              </Stack>
            </Stack>

            <Box>
              <LoadingButton
                variant="contained"
                size="large"
                fullWidth
                onClick={() => {
                  window.negotiator.negotiate(undefined, true);
                }}
                sx={{
                  mt: 1,
                  marginTop: '50px',
                  bottom: theme.spacing(3),
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  left: '0',
                  right: '0'
                }}
              >
                Claim
              </LoadingButton>
            </Box>
          </Stack>
        </Card>
        <Modal open={modalMode > 0}>
          <ContainerStyle maxWidth="xs" sx={{ textAlign: 'center' }}>

            { modalMode === 1 &&
              <>
                <Stack direction="column" mb={2}  alignItems={{ xs: 'center', sm: 'left' }}>
                  <Image src={emailIcon} sx={{width: '120px', height: 'auto'}} padding="10px" />
                </Stack>
                <Typography sx={{mt: 1}}>
                  In order to get Cashback, you need to get an email attestation to prove ticket ownership.
                  Note, that your email address will be stored in your local storage only. This is fully decentralized.
                </Typography>

                <Stack direction="row" mt={1}>
                  <Button
                  sx={{mt: 2}}
                  size="large"
                  fullWidth
                  variant="contained"
                  onClick={() => {
                  setModalMode(0);
                  window.negotiator.authenticate({issuer: "devcon", unsignedToken: ticket})
                }}
                  >
                  Prove Ticket Ownership
                  </Button>
                </Stack>
              </>
            }

            {modalMode === 2 &&
              <>
                <Stack direction="column" mb={2}  alignItems={{ xs: 'center', sm: 'left' }}>
                  <Image src={tickIcon} sx={{width: '120px', height: 'auto'}} padding="10px" />
                </Stack>

                <Typography sx={{mt: 1}}>
                  Request successful! After Devcon week you will receive $50 USD worth of Ethereum at your address.
                </Typography>

                <Stack direction="row" mt={1}>
                  <Button
                    sx={{mt: 2}}
                    size="large"
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setModalMode(0);
                    }}
                  >
                    Close
                  </Button>
                </Stack>
              </>
            }

            {modalMode === 3 &&
              <>
                <Stack direction="column" mb={2}  alignItems={{ xs: 'center', sm: 'left' }}>
                  <Image src={errorIcon} sx={{width: '120px', height: 'auto'}} padding="10px" />
                </Stack>

                <Typography sx={{mt: 1}}>
                  {error.message}
                  <br/><br/>
                  {error.detail}
                </Typography>

                <Stack direction="row" mt={1}>
                  <Button
                    sx={{mt: 2}}
                    size="large"
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setModalMode(0);
                    }}
                  >
                    Close
                  </Button>
                </Stack>
              </>
            }
          </ContainerStyle>
        </Modal>
        <div className="overlay-tn"></div>
      </>
      }
    </>
  );
}
