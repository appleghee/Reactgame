/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <div className="w-screen h-screen fixed inset-0 bg-black">
      <GameCanvas />
    </div>
  );
}
