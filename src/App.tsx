/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

export default function App() {
  const [chats, setChats] = useState<string[]>([]);

  const handleNewChat = () => {
    // Refresh the page to reset state (simple version)
    window.location.reload();
  };

  const addChatToHistory = (title: string) => {
    setChats(prev => [title, ...prev]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar onNewChat={handleNewChat} chats={chats} />
      <main className="flex-1 overflow-hidden">
        <ChatArea onFirstMessage={addChatToHistory} />
      </main>
    </div>
  );
}
