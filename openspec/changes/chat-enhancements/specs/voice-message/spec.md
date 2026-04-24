## ADDED Requirements

### Requirement: Voice recording initiation
The system SHALL allow users to start recording a voice message by holding down a microphone button in the message input area.

#### Scenario: Start recording
- **WHEN** user presses and holds the microphone button
- **THEN** a recording interface appears showing recording duration
- **AND** the system starts capturing audio via MediaRecorder API

### Requirement: Voice recording cancellation
The system SHALL allow users to cancel a recording by dragging away from the microphone button or releasing outside the recording area.

#### Scenario: Cancel recording
- **WHEN** user drags away from the microphone button while holding
- **THEN** the recording is discarded
- **AND** the recording interface closes without sending

### Requirement: Voice message sending
The system SHALL send a voice message when the user releases the microphone button within the recording area.

#### Scenario: Send voice message
- **WHEN** user releases the microphone button after recording
- **THEN** the audio file is uploaded to Supabase Storage
- **AND** a message with type "voice" is created in the conversation
- **AND** the message appears in the chat in real-time

### Requirement: Voice message playback
The system SHALL allow users to play voice messages directly in the chat.

#### Scenario: Play voice message
- **WHEN** user clicks the play button on a voice message bubble
- **THEN** the voice audio plays
- **AND** a progress bar shows playback progress
- **AND** the play button changes to a pause button

#### Scenario: Pause voice message
- **WHEN** user clicks the pause button during playback
- **THEN** the audio pauses at the current position
- **AND** the pause button changes back to a play button

### Requirement: Voice message duration display
The system SHALL display the duration of each voice message in the chat bubble.

#### Scenario: Show voice duration
- **WHEN** a voice message is displayed in the chat
- **THEN** the bubble shows the recording duration (e.g., "0:23")

### Requirement: Maximum recording duration
The system SHALL limit voice recordings to a maximum of 60 seconds.

#### Scenario: Recording timeout
- **WHEN** a recording reaches 60 seconds
- **THEN** the recording automatically stops
- **AND** the voice message is sent
