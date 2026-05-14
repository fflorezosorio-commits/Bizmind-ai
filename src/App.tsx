/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ContactModal } from './components/ContactModal';

export default function App() {
  const [chats, setChats] = useState<string[]>([]);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleNewChat = () => {
    // Refresh the page to reset state (simple version)
    window.location.reload();
  };

  const addChatToHistory = (title: string) => {
    setChats(prev => [title, ...prev]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        onNewChat={handleNewChat} 
        onContactClick={() => setIsContactOpen(true)}
        chats={chats} 
      />
      <main className="flex-1 overflow-hidden">
        <ChatArea onFirstMessage={addChatToHistory} />
      </main>

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
      />
    </div>
  );
}
