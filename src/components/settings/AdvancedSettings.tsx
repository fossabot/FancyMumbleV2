import { Alert, Box, Container, FormControlLabel, FormGroup, Switch, Typography, } from "@mui/material";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { defaultInitializeUser, } from "../../store/features/users/userSlice";
import { useTheme } from '@mui/material/styles';
import './styles/Profile.css'
import { ChangeEvent, useState } from "react";
import { updateAdvancedSettings } from "../../store/features/users/frontendSettings";


function Profile() {
    const theme = useTheme();
    const dispatch = useDispatch();

    let [errorMessage, setErrorMessage] = useState('');
    const advancedSettings = useSelector((state: RootState) => state.reducer.frontendSettings).advancedSettings;

    function showErrorMessage() {
        if (errorMessage) {
            return <Alert severity="error">{errorMessage}</Alert>
        }
    }

    function updateAutoScroll(e: ChangeEvent<HTMLInputElement>): void {
        dispatch(updateAdvancedSettings({ ...advancedSettings, disableAutoscroll: e.target.checked } ));
    }

    function updateScrollState(e: ChangeEvent<HTMLInputElement>): void {
        dispatch(updateAdvancedSettings({  ...advancedSettings, alwaysScrollDown: e.target.checked }));
    }

    return (
        <Box>
            <Container className="settingsContainer">
                {showErrorMessage()}
                <Typography variant="h4">Additional Features</Typography>
                <FormGroup>
                    <FormControlLabel control={<Switch value={advancedSettings.disableAutoscroll} onChange={(e) => updateAutoScroll(e)} />} label="Disable Auto-Scroll" />
                    <FormControlLabel control={<Switch value={advancedSettings.alwaysScrollDown} onChange={(e) => updateScrollState(e)} disabled={advancedSettings.disableAutoscroll} />} label="Always auto-scroll, even if scrolled up" />
                </FormGroup>
            </Container>
        </Box >
    )
}

export default Profile;