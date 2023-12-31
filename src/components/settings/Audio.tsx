import { Box, Button, Collapse, Container, FormControl, FormControlLabel, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Select, Slider, Switch, Typography, RadioGroup, Radio, Paper, InputBase, Divider } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import LoopIcon from '@mui/icons-material/Loop';
import { useEffect, useState } from "react";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FloatingApply from "./components/FloatingApply";
import { listen } from "@tauri-apps/api/event";

enum InputMode {
    VoiceActivation = 0,
    PushToTalk = 1,
}

function AudioSettings() {
    let [inputDevice, setInputDevice] = useState('');
    let [inputDeviceList, setInputDeviceList] = useState([]);
    const [voiceHold, setVoiceHold] = useState<number>(10);
    const [fadeOutDuration, setFadeOutDuration] = useState<number>(10);
    const [advancedOptions, showAdvanceOptions] = useState(true);
    const [amplification, setAmplification] = useState<number>(10);
    const [voiceHysteresis, setVoiceHysteresis] = useState<number[]>([0.1, 0.2]);
    const [audioLevel, setAudioLevel] = useState<number>(10);
    const [inputMode, setInputMode] = useState<InputMode>(InputMode.VoiceActivation);

    useEffect(() => {
        invoke('enable_audio_info');
        const unlisten = listen('audio_preview', (event) => {
            setAudioLevel(event.payload as number);
        });

        return () => {
            invoke('disable_audio_info');
            unlisten.then(stop => stop());
        }
    }, []);

    function getAudioDevices() {
        invoke('get_audio_devices')
            .then((devices: any) => {
                setInputDeviceList(devices);
            })
    }

    function setAudioSetting() {
        let settings = {
            amplification: amplification,
            input_mode: InputMode[inputMode] as keyof typeof inputMode,
            voice_activation_options: {
                voice_hold: Math.floor(calculateVoiceHold(voiceHold)),
                fade_out_duration: Math.floor(calculateVoiceHold(fadeOutDuration)),
                voice_hysteresis_lower_threshold: voiceHysteresis[0],
                voice_hysteresis_upper_threshold: voiceHysteresis[1],
            }
        };
        console.log(settings);
        invoke('save_frontend_settings', { settingsName: 'audio_input', data: { 'AudioInput': settings } });
        invoke('set_audio_input_setting', { 'settings': settings });
    }

    function calculateVoiceHold(value: number) {
        return 1.2 ** value;
    }

    function valueLabelFormat(ms: number): string {
        const timeUnits = [
            { unit: 'd', value: 86400000 },
            { unit: 'h', value: 3600000 },
            { unit: 'm', value: 60000 },
            { unit: 's', value: 1000 },
            { unit: 'ms', value: 1 }
        ];

        for (const element of timeUnits) {
            if (ms >= element.value) {
                return `${(ms / element.value).toFixed(2)}${element.unit}`;
            }
        }

        return "0ms";
    }

    function handleVoiceHoldChange(event: Event, newValue: number | number[]) {
        if (typeof newValue === 'number') {
            setVoiceHold(newValue);
        }
    }

    function handleFadeOutDuration(event: Event, newValue: number | number[]) {
        if (typeof newValue === 'number') {
            setFadeOutDuration(newValue);
        }
    }

    function remap(value: number, max: number): number {
        return (value / max) * 100;
    }

    return (
        <Container>
            <Typography variant="h3">Audio</Typography>
            <FormControl sx={{ m: 1, minWidth: 120, justifyContent: 'center' }} size="small">
                <InputLabel id="demo-simple-select-label">Input Device</InputLabel>
                <Select
                    labelId="demo-simple-select-helper-label"
                    id="demo-simple-select-helper"
                    value={inputDevice}
                    label="Input Device"
                    onChange={(e) => setInputDevice(e.target.value as any)}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {inputDeviceList.map((value) => {
                        return (<MenuItem value={value}>{value}</MenuItem>);
                    })}
                </Select>
            </FormControl>
            <IconButton color="primary" onClick={getAudioDevices}><LoopIcon /></IconButton >
            <Divider sx={{ my: 4 }} />
            <Box>
                <Box mt={2} mb={2}>
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={InputMode.VoiceActivation}
                        name="radio-buttons-group"
                        value={inputMode}
                        onChange={(e, v) => setInputMode(Number(v))}
                    >
                        <FormControlLabel value={InputMode.VoiceActivation} control={<Radio />} label="Voice Activation" />
                        <FormControlLabel value={InputMode.PushToTalk} control={<Radio />} label="Push-to-Talk" />
                    </RadioGroup>
                </Box>
                <Collapse in={inputMode === InputMode.VoiceActivation}>
                    <LinearProgress
                        variant="buffer"
                        value={remap(audioLevel, 1)}
                        valueBuffer={remap(voiceHysteresis[1], 1)}
                        color={audioLevel > voiceHysteresis[1] ? 'success' : 'error'}
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                transition: '50ms linear',
                            }
                        }}
                    />
                    <Divider sx={{ my: 4 }} />
                    <FormControlLabel label="Automatically detect Microphone sensitivity (Not Implemented)" control={<Switch disabled checked={!advancedOptions} onChange={() => showAdvanceOptions(!advancedOptions)} />} />
                    <Collapse in={advancedOptions}>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 18 }} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <Grid item xs={4} sm={8} md={12} lg={12}>
                                <Typography id="non-linear-slider" gutterBottom>
                                    Audio hold duration: {valueLabelFormat(calculateVoiceHold(voiceHold))}
                                </Typography>
                                <Slider
                                    value={voiceHold}
                                    min={0}
                                    step={1}
                                    max={60}
                                    scale={calculateVoiceHold}
                                    getAriaValueText={valueLabelFormat}
                                    valueLabelFormat={valueLabelFormat}
                                    onChange={handleVoiceHoldChange}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="non-linear-slider"
                                />
                            </Grid>
                            <Grid item xs={4} sm={8} md={12} lg={12}>
                                <Typography id="non-linear-slider" gutterBottom>
                                    Fade-out Duration: {valueLabelFormat(calculateVoiceHold(fadeOutDuration))}
                                </Typography>
                                <Slider
                                    value={fadeOutDuration}
                                    min={0}
                                    step={1}
                                    max={60}
                                    scale={calculateVoiceHold}
                                    getAriaValueText={valueLabelFormat}
                                    valueLabelFormat={valueLabelFormat}
                                    onChange={handleFadeOutDuration}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="non-linear-slider"
                                />
                            </Grid>
                            <Grid item xs={4} sm={8} md={12} lg={12}>
                                <Typography id="non-linear-slider" gutterBottom>
                                    Voice Hysteresis: {voiceHysteresis[0]} - {voiceHysteresis[1]}
                                </Typography>
                                <Slider
                                    min={0}
                                    step={0.01}
                                    max={1}
                                    getAriaLabel={() => ''}
                                    value={voiceHysteresis}
                                    onChange={(e, v) => setVoiceHysteresis(v as number[])}
                                    valueLabelDisplay="auto"
                                    disableSwap
                                />
                            </Grid>
                        </Grid>
                    </Collapse>
                </Collapse>
                <Collapse in={inputMode === InputMode.PushToTalk}>
                    <Paper
                        component="form"
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
                    >
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder="Record Button..."
                            inputProps={{ 'aria-label': 'select button' }}
                            disabled
                        />
                        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                        <IconButton color="primary" sx={{ p: '10px' }} aria-label="select button">
                            <KeyboardIcon />
                        </IconButton>
                    </Paper>

                    <Slider
                        min={0}
                        step={1}
                        max={60}
                        scale={calculateVoiceHold}
                        getAriaValueText={valueLabelFormat}
                        valueLabelFormat={valueLabelFormat}
                        valueLabelDisplay="auto"
                        aria-labelledby="non-linear-slider"
                    />
                </Collapse>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Box>
                <Grid item xs={4} sm={8} md={12} lg={12}>
                    <Typography id="non-linear-slider" gutterBottom>
                        Amplification: +{amplification}dB
                    </Typography>
                    <Slider
                        value={amplification}
                        min={0}
                        step={1}
                        max={20}
                        onChange={(e, v) => setAmplification(v as number)}
                        valueLabelDisplay="auto"
                        aria-labelledby="non-linear-slider"
                    />
                </Grid>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Box>
                <Typography id="non-linear-slider" gutterBottom>
                    Echo Suppression
                </Typography>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue={1}
                    name="radio-buttons-group"
                >
                    <FormControlLabel value={0} control={<Radio />} label="Echo Suppression A (Not Implemented)" />
                    <FormControlLabel value={1} control={<Radio />} label="Echo Suppression B (Not Implemented)" />
                </RadioGroup>
            </Box>
            <Box sx={{ my: 4 }}>
                <Typography id="non-linear-slider" gutterBottom>
                    Noice Cancelation
                </Typography>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue={1}
                    name="radio-buttons-group"
                >
                    <FormControlLabel value={0} control={<Radio />} label="Noice Cancelation A (Not Implemented)" />
                    <FormControlLabel value={1} control={<Radio />} label="Noice Cancelation B (Not Implemented)" />
                </RadioGroup>
            </Box>
            <Divider sx={{ my: 4 }} />
            <FloatingApply discardText="Discard" saveText="Apply" onDiscard={() => { }} onSave={() => setAudioSetting()} />
        </Container>
    )
}

export default AudioSettings;