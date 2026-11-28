import React from 'react';
import { Composition, Sequence, Audio, staticFile } from 'remotion';
import { Scene1WhatsApp } from './scenes/Scene1WhatsApp';
import { Scene2Cover } from './scenes/Scene2Cover';
import { Scene3Warta } from './scenes/Scene3Warta';
import { Scene4Form } from './scenes/Scene4Form';
import { Scene5Kartu } from './scenes/Scene5Kartu';
import { Scene6Closing } from './scenes/Scene6Closing';
import {
  SCENE_DURATIONS,
  TOTAL_DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from './constants';

export const TutorialUndanganVideo: React.FC = () => {
  const f1 = 0;
  const f2 = SCENE_DURATIONS.scene1;
  const f3 = f2 + SCENE_DURATIONS.scene2;
  const f4 = f3 + SCENE_DURATIONS.scene3;
  const f5 = f4 + SCENE_DURATIONS.scene4;
  const f6 = f5 + SCENE_DURATIONS.scene5;

  return (
    <div className="w-full h-full bg-[#03130f] font-sans relative overflow-hidden">
      {/* 🎵 Global Background Music (Mars Ya Lal Wathan Instrumental - Lembut 16% Volume) */}
      <Audio
        src={staticFile('audio/backsong.mp3')}
        volume={0.16}
        loop
      />

      {/* 🎙️ SCENE 1: Pesan WhatsApp (0 - 7s) */}
      <Sequence from={f1} durationInFrames={SCENE_DURATIONS.scene1}>
        <Audio src={staticFile('audio/vo_scene1.mp3')} volume={1.0} />
        <Scene1WhatsApp />
      </Sequence>

      {/* 🎙️ SCENE 2: Sampul Amplop Undangan (7s - 15s) */}
      <Sequence from={f2} durationInFrames={SCENE_DURATIONS.scene2}>
        <Audio src={staticFile('audio/vo_scene2.mp3')} volume={1.0} />
        <Scene2Cover />
      </Sequence>

      {/* 🎙️ SCENE 3: Warta & 5 Halaqah Tematik (15s - 30s) */}
      <Sequence from={f3} durationInFrames={SCENE_DURATIONS.scene3}>
        <Audio src={staticFile('audio/vo_scene3.mp3')} volume={1.0} />
        <Scene3Warta />
      </Sequence>

      {/* 🎙️ SCENE 4: Pengisian Formulir Delegasi (30s - 44s) */}
      <Sequence from={f4} durationInFrames={SCENE_DURATIONS.scene4}>
        <Audio src={staticFile('audio/vo_scene4.mp3')} volume={1.0} />
        <Scene4Form />
      </Sequence>

      {/* 🎙️ SCENE 5: Penerbitan Kartu Hadir E-Pass & Simpan Gambar (44s - 54s) */}
      <Sequence from={f5} durationInFrames={SCENE_DURATIONS.scene5}>
        <Audio src={staticFile('audio/vo_scene5.mp3')} volume={1.0} />
        <Scene5Kartu />
      </Sequence>

      {/* 🎙️ SCENE 6: Penutup & Sampai Jumpa di Lokasi (54s - 60s) */}
      <Sequence from={f6} durationInFrames={SCENE_DURATIONS.scene6}>
        <Audio src={staticFile('audio/vo_scene6.mp3')} volume={1.0} />
        <Scene6Closing />
      </Sequence>
    </div>
  );
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="TutorialUndangan"
      component={TutorialUndanganVideo}
      durationInFrames={TOTAL_DURATION_IN_FRAMES}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
};
