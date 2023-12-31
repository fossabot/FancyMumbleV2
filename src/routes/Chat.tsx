import { Box } from '@mui/material';

import ChatMessageContainer from '../components/ChatMessageContainer';

import Sidebar from '../components/Sidebar';
import { RootState } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import ChatInput from '../components/ChatInput';
import { useEffect, useState } from 'react';

import ChatInfoBar from '../components/ChatInfoBar';
import EventLog from '../components/EventLog';
import { invoke } from '@tauri-apps/api';
import { updateFrontendSettings } from '../store/features/users/frontendSettings';


function Chat() {
    const [showLog, setShowLog] = useState(false);

    const messageLog = useSelector((state: RootState) => state.reducer.chatMessage);
    const dispatch = useDispatch();

    useEffect(() => {
        invoke<string>('get_frontend_settings', { settingsName: 'general' }).then((result) => {
            console.log("settings: ", result);
            dispatch(updateFrontendSettings(JSON.parse(result)));
        }).catch(e => {
            console.log(e);
        });

        invoke<any>('get_frontend_settings', { settingsName: 'audio_input' }).then((result) => {
            let parsedSettings = JSON.parse(result);
            if(parsedSettings?.AudioInput) {
                dispatch(updateFrontendSettings(parsedSettings.AudioInput));
                invoke('set_audio_input_setting', { 'settings': parsedSettings.AudioInput }).then(() => {
                    console.log("set_audio_input_setting: ", parsedSettings.AudioInput);
                }).catch(e => {
                    console.log(e);
                });
            }
        });
    }, []);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        filter: ' blur(10px)',
                        background: 'transparent',
                        backgroundSize: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: -1
                    }}></Box>
                    <ChatInfoBar onShowLog={setShowLog} />
                    <ChatMessageContainer messages={messageLog}></ChatMessageContainer>
                    <ChatInput />
                </Box>
            </Box>
            <EventLog showLog={showLog} />
        </Box>
    )
}

export default Chat;
