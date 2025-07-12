
import React, { useState, useContext, createContext, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, Outlet } from 'react-router-dom';

// ========= TYPES =========
export interface User {
  id: number;
  name: string;
  email: string;
  profilePhoto: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  availability: string;
  isPublic: boolean;
  location: string;
}

export enum SwapStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export interface SwapRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  offeredSkill: string;
  wantedSkill: string;
  message: string;
  status: SwapStatus;
}

export interface Chat {
  id: number;
  participantIds: number[];
  lastMessageTimestamp: string;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  text: string;
  timestamp: string;
}


// ========= ICONS =========
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const MessagesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const StarIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

// ========= MOCK DATA =========
const USERS: User[] = [
  { id: 1, name: 'Marc Demo', email: 'marc@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=marc', skillsOffered: ['JavaScript', 'Python', 'React'], skillsWanted: ['Graphic Design', 'Video Editing'], rating: 3.9, availability: 'Weekends', isPublic: true, location: 'New York, USA' },
  { id: 2, name: 'Michell', email: 'michell@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=michell', skillsOffered: ['Java', 'Spring Boot', 'SQL'], skillsWanted: ['Python', 'Machine Learning'], rating: 4.5, availability: 'Weekdays', isPublic: true, location: 'London, UK' },
  { id: 3, name: 'Joe Wills', email: 'joe@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=joe', skillsOffered: ['UI/UX Design', 'Figma', 'Adobe XD'], skillsWanted: ['JavaScript', 'HTML/CSS'], rating: 4.0, availability: 'Full-time', isPublic: true, location: 'Berlin, Germany' },
  { id: 4, name: 'Aisha Khan', email: 'aisha@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=aisha', skillsOffered: ['Data Science', 'Pandas', 'NumPy'], skillsWanted: ['React Native', 'Firebase'], rating: 4.8, availability: 'Part-time', isPublic: true, location: 'Toronto, Canada' },
  { id: 5, name: 'Carlos Ruiz', email: 'carlos@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=carlos', skillsOffered: ['Project Management', 'Agile', 'Scrum'], skillsWanted: ['DevOps', 'Docker'], rating: 4.2, availability: 'Weekends', isPublic: false, location: 'Madrid, Spain' },
  { id: 6, name: 'Mei Lin', email: 'mei@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=mei', skillsOffered: ['Content Writing', 'SEO', 'Marketing'], skillsWanted: ['Graphic Design'], rating: 4.6, availability: 'Weekdays', isPublic: true, location: 'Singapore' },
  { id: 7, name: 'David Chen', email: 'david@demo.com', profilePhoto: 'https://i.pravatar.cc/150?u=david', skillsOffered: ['Cybersecurity', 'Penetration Testing'], skillsWanted: ['Cloud Architecture'], rating: 4.9, availability: 'Full-time', isPublic: true, location: 'Sydney, Australia' },
];

const SWAP_REQUESTS: SwapRequest[] = [
    { id: 1, fromUserId: 2, toUserId: 1, offeredSkill: 'Java', wantedSkill: 'Graphic Design', message: 'Hey Marc, I can help you with Java development. I would love to learn some graphic design basics from you.', status: SwapStatus.Pending },
    { id: 2, fromUserId: 3, toUserId: 1, offeredSkill: 'UI/UX Design', wantedSkill: 'Python', message: 'Hi Marc, saw you wanted help with Python. I can trade my UI/UX skills.', status: SwapStatus.Rejected },
    { id: 3, fromUserId: 4, toUserId: 2, offeredSkill: 'Data Science', wantedSkill: 'Machine Learning', message: 'Michell, I am proficient in Data Science and would be interested in your Machine Learning expertise.', status: SwapStatus.Accepted },
];

const CHATS: Chat[] = [
    { id: 1, participantIds: [2, 4], lastMessageTimestamp: '2023-10-27T11:30:00Z' },
];

const CHAT_MESSAGES: ChatMessage[] = [
    { id: 1, chatId: 1, senderId: 4, text: "Hi Michell, thanks for accepting my request!", timestamp: '2023-10-27T11:28:00Z' },
    { id: 2, chatId: 1, senderId: 2, text: "No problem, Aisha. Your data science skills look impressive.", timestamp: '2023-10-27T11:30:00Z' },
];


// ========= AUTH CONTEXT =========
interface AuthContextType {
  currentUser: User | null;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  signup: (name: string, email: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string) => {
    const user = USERS.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('User not found');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const signup = (name: string, email: string) => {
    const existingUser = USERS.find(u => u.email === email);
    if (existingUser) {
      alert('A user with this email already exists.');
      return;
    }

    const newUser: User = {
      id: USERS.length + 1,
      name,
      email,
      profilePhoto: `https://i.pravatar.cc/150?u=${email}`,
      skillsOffered: [],
      skillsWanted: [],
      rating: 0,
      availability: 'Not set',
      isPublic: true,
      location: 'Not set',
    };

    USERS.push(newUser);
    setCurrentUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    const userIndex = USERS.findIndex(u => u.id === updatedUser.id);
    if(userIndex !== -1) {
        USERS[userIndex] = updatedUser;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ========= UI COMPONENTS =========
interface SkillBadgeProps {
  skill: string;
}
const SkillBadge = ({ skill }: SkillBadgeProps) => (
  <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-300 mr-2 mb-2">
    {skill}
  </span>
);

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => (
    <div className="flex justify-center items-center space-x-2 mt-8">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition">
            &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => onPageChange(page)} className={`px-4 py-2 rounded-md ${currentPage === page ? 'bg-teal-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} transition`}>
                {page}
            </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition">
            &gt;
        </button>
    </div>
);

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-teal-400">
              SkillSwap Platform
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Home</Link>
                <Link to="/requests" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Swap Requests</Link>
                <Link to="/messages" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Messages</Link>
                <button onClick={logout} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Logout</button>
                <Link to="/profile">
                    <img className="h-10 w-10 rounded-full border-2 border-teal-400" src={currentUser.profilePhoto} alt="User profile" />
                </Link>
              </>
            ) : (
                <>
                <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Home</Link>
                <button onClick={() => navigate('/login')} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    Login
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

interface UserCardProps {
    user: User;
    onShowLogin: () => void;
}
const UserCard = ({ user, onShowLogin }: UserCardProps) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const handleRequest = () => {
        if (!currentUser) {
            onShowLogin();
        } else {
            navigate(`/user/${user.id}`);
        }
    };
    
    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-teal-500/20 transition-shadow duration-300 transform hover:-translate-y-1">
            <div className="p-6">
                <div className="flex items-center space-x-4">
                    <img className="h-20 w-20 rounded-full border-4 border-gray-700" src={user.profilePhoto} alt={user.name} />
                    <div>
                        <div className="text-xl font-bold text-white">{user.name}</div>
                        <div className="flex items-center mt-1">
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                            <span className="text-gray-400 ml-1">{user.rating}/5</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold text-teal-400">Skills Offered</h4>
                    <div className="mt-2 flex flex-wrap">
                        {user.skillsOffered.slice(0, 3).map(skill => <SkillBadge key={skill} skill={skill} />)}
                    </div>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold text-teal-400">Skills Wanted</h4>
                    <div className="mt-2 flex flex-wrap">
                        {user.skillsWanted.slice(0, 3).map(skill => <SkillBadge key={skill} skill={skill} />)}
                    </div>
                </div>
                <div className="mt-6">
                    <button onClick={handleRequest} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">
                        Request
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl w-full max-w-sm">
                <h2 className="text-2xl font-bold text-white text-center mb-4">Login Required</h2>
                <p className="text-gray-400 text-center mb-6">You need to be logged in to send a swap request.</p>
                <div className="flex flex-col space-y-4">
                    <button onClick={() => { navigate('/login'); onClose(); }} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">
                        Login / Sign Up
                    </button>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const RequestModal = ({ isOpen, onClose, targetUser }: { isOpen: boolean; onClose: () => void; targetUser: User | null }) => {
    const { currentUser } = useAuth();
    const [offeredSkill, setOfferedSkill] = useState('');
    const [wantedSkill, setWantedSkill] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    if (!isOpen || !currentUser || !targetUser) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!offeredSkill || !wantedSkill) {
            alert("Please select both skills.");
            return;
        }
        const newRequest: SwapRequest = {
            id: Date.now(),
            fromUserId: currentUser.id,
            toUserId: targetUser.id,
            offeredSkill,
            wantedSkill,
            message,
            status: SwapStatus.Pending,
        };
        SWAP_REQUESTS.push(newRequest);
        alert('Swap request sent!');
        onClose();
        navigate('/requests');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8 shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Send Swap Request to {targetUser.name}</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="offeredSkill" className="block text-sm font-medium text-gray-300 mb-1">Choose one of your offered skills</label>
                        <select id="offeredSkill" value={offeredSkill} onChange={e => setOfferedSkill(e.target.value)} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2" required>
                            <option value="">Select skill</option>
                            {currentUser.skillsOffered.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="wantedSkill" className="block text-sm font-medium text-gray-300 mb-1">Choose one of their wanted skills</label>
                        <select id="wantedSkill" value={wantedSkill} onChange={e => setWantedSkill(e.target.value)} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2" required>
                            <option value="">Select skill</option>
                            {targetUser.skillsWanted.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                        <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2" placeholder="Write a short message..."></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                    <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">Submit</button>
                </div>
            </form>
        </div>
    );
};


// ========= PAGES =========
const HomePage = () => {
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('');

    const usersPerPage = 6;
    const publicUsers = USERS.filter(user => user.isPublic);
    
    const allAvailabilities = useMemo(() => ['All', ...Array.from(new Set(publicUsers.map(u => u.availability)))], [publicUsers]);

    const filteredUsers = useMemo(() => publicUsers.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.skillsOffered.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
            user.skillsWanted.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesAvailability = availabilityFilter ? user.availability === availabilityFilter : true;
        
        return matchesSearch && matchesAvailability;
    }), [publicUsers, searchQuery, availabilityFilter]);


    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
            <div className="bg-gray-800 rounded-lg p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative flex-grow w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search by name or skill..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
                 <div className="relative w-full md:w-48">
                    <select
                        value={availabilityFilter}
                        onChange={(e) => {
                            setAvailabilityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                       {allAvailabilities.map(avail => (
                            <option key={avail} value={avail === 'All' ? '' : avail}>{avail}</option>
                       ))}
                    </select>
                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDownIcon />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentUsers.map(user => (
                    <UserCard key={user.id} user={user} onShowLogin={() => setLoginModalOpen(true)} />
                ))}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </div>
    );
};

const LoginPage = () => {
    const [email, setEmail] = useState('marc@demo.com'); // Pre-fill for demo
    const [password, setPassword] = useState('password'); // Dummy password
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-white text-center mb-2">Skill Swap Platform</h2>
                <p className="text-gray-400 text-center mb-8">Login to continue</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                     <div className="text-right text-sm">
                        <a href="#" className="font-medium text-teal-400 hover:text-teal-500">Forgot username/password?</a>
                    </div>
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition">
                        Login
                    </button>
                    <p className="text-sm text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-teal-400 hover:text-teal-500">
                            Sign Up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords don't match.");
            return;
        }
        signup(name, email);
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-white text-center mb-2">Create Account</h2>
                <p className="text-gray-400 text-center mb-8">Join SkillSwap to start learning and sharing</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition">
                        Sign Up
                    </button>
                    <p className="text-sm text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-teal-400 hover:text-teal-500">
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};


const ProfilePage = () => {
    const { currentUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(currentUser);
    const [newSkillOffered, setNewSkillOffered] = useState('');
    const [newSkillWanted, setNewSkillWanted] = useState('');

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleSave = () => {
        if (user) {
            updateUser(user);
            alert('Profile saved!');
        }
    };
    
    const handleAddSkill = (type: 'offered' | 'wanted') => {
        if(type === 'offered' && newSkillOffered) {
            setUser(prevUser => prevUser ? {...prevUser, skillsOffered: [...prevUser.skillsOffered, newSkillOffered]} : null);
            setNewSkillOffered('');
        }
        if(type === 'wanted' && newSkillWanted) {
            setUser(prevUser => prevUser ? {...prevUser, skillsWanted: [...prevUser.skillsWanted, newSkillWanted]} : null);
            setNewSkillWanted('');
        }
    };
    
    const handleRemoveSkill = (skillToRemove: string, type: 'offered' | 'wanted') => {
        if(type === 'offered') {
            setUser(prevUser => prevUser ? {...prevUser, skillsOffered: prevUser.skillsOffered.filter(s => s !== skillToRemove)} : null);
        }
        if(type === 'wanted') {
            setUser(prevUser => prevUser ? {...prevUser, skillsWanted: prevUser.skillsWanted.filter(s => s !== skillToRemove)} : null);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">User Profile</h1>
                    <div>
                        <button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition mr-2">Save</button>
                        <button onClick={() => navigate('/')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition">Discard</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 flex flex-col items-center">
                        <img src={user.profilePhoto} alt="Profile" className="w-40 h-40 rounded-full border-4 border-teal-400 object-cover mb-4" />
                        <button className="text-sm text-teal-400 hover:underline">Add/Edit/Remove</button>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Name</label>
                            <input type="text" value={user.name} onChange={e => setUser(prev => prev ? {...prev, name: e.target.value} : null)} className="mt-1 w-full bg-gray-700 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Location</label>
                            <input type="text" value={user.location} onChange={e => setUser(prev => prev ? {...prev, location: e.target.value} : null)} className="mt-1 w-full bg-gray-700 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Availability</label>
                            <input type="text" value={user.availability} onChange={e => setUser(prev => prev ? {...prev, availability: e.target.value} : null)} className="mt-1 w-full bg-gray-700 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Profile</label>
                             <div className="mt-2 flex items-center">
                                <span className="mr-3 text-white">{user.isPublic ? 'Public' : 'Private'}</span>
                                <button onClick={() => setUser(prev => prev ? {...prev, isPublic: !prev.isPublic} : null)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${user.isPublic ? 'bg-teal-500' : 'bg-gray-600'}`}>
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${user.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-teal-400 mb-2">Skills Offered</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {user.skillsOffered.map(skill => (
                                    <div key={skill} className="bg-gray-700 rounded-full px-3 py-1 flex items-center">
                                        <span className="text-sm font-semibold text-gray-300 mr-2">{skill}</span>
                                        <button onClick={() => handleRemoveSkill(skill, 'offered')} className="text-red-400 hover:text-red-600">×</button>
                                    </div>
                                ))}
                            </div>
                             <div className="flex gap-2">
                                <input type="text" value={newSkillOffered} onChange={e => setNewSkillOffered(e.target.value)} placeholder="Add a skill" className="flex-grow bg-gray-700 text-white rounded-md p-2" />
                                <button onClick={() => handleAddSkill('offered')} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">Add</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-teal-400 mb-2">Skills Wanted</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {user.skillsWanted.map(skill => (
                                    <div key={skill} className="bg-gray-700 rounded-full px-3 py-1 flex items-center">
                                        <span className="text-sm font-semibold text-gray-300 mr-2">{skill}</span>
                                        <button onClick={() => handleRemoveSkill(skill, 'wanted')} className="text-red-400 hover:text-red-600">×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newSkillWanted} onChange={e => setNewSkillWanted(e.target.value)} placeholder="Add a skill" className="flex-grow bg-gray-700 text-white rounded-md p-2" />
                                <button onClick={() => handleAddSkill('wanted')} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">Add</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

const UserDetailPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const user = USERS.find(u => u.id === parseInt(userId || ''));
    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    
    if (!user) {
        return <div className="text-center py-10">User not found</div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <RequestModal isOpen={isRequestModalOpen} onClose={() => setRequestModalOpen(false)} targetUser={user} />
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                 <div className="flex flex-col md:flex-row items-start">
                    <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 text-center">
                        <img src={user.profilePhoto} alt={user.name} className="w-40 h-40 rounded-full border-4 border-teal-400 object-cover mx-auto" />
                        <h1 className="text-3xl font-bold text-white mt-4">{user.name}</h1>
                         <div className="flex items-center justify-center mt-2">
                            <StarIcon className="w-6 h-6 text-yellow-400" />
                            <span className="text-gray-300 ml-2 text-xl">{user.rating}/5</span>
                        </div>
                        <button onClick={() => setRequestModalOpen(true)} className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition">
                            Request
                        </button>
                    </div>

                    <div className="w-full">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold text-teal-400 mb-4">Skills Offered</h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.skillsOffered.map(skill => <SkillBadge key={skill} skill={skill} />)}
                                </div>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold text-teal-400 mb-4">Skills Wanted</h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.skillsWanted.map(skill => <SkillBadge key={skill} skill={skill} />)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 bg-gray-900/50 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-teal-400 mb-4">Rating and Feedback</h3>
                            <p className="text-gray-400">Feedback section coming soon!</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const RequestsPage = () => {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState(SWAP_REQUESTS);
    const navigate = useNavigate();

    if (!currentUser) {
        return <div className="text-center py-10">Please log in to see your requests.</div>;
    }
    
    const userRequests = requests.filter(r => r.toUserId === currentUser.id || r.fromUserId === currentUser.id);

    const handleStatusChange = (requestId: number, newStatus: SwapStatus) => {
        setRequests(prev => prev.map(r => r.id === requestId ? {...r, status: newStatus} : r));
        const reqIndex = SWAP_REQUESTS.findIndex(r => r.id === requestId);
        if(reqIndex !== -1) {
            SWAP_REQUESTS[reqIndex].status = newStatus;
        }
    };
    
    const handleGoToChat = (otherUserId: number) => {
        if (!currentUser) return;

        let chat = CHATS.find(c => 
            c.participantIds.includes(currentUser.id) && 
            c.participantIds.includes(otherUserId)
        );

        if (chat) {
            navigate(`/chat/${chat.id}`);
        } else {
            const newChat: Chat = {
                id: CHATS.length + 1,
                participantIds: [currentUser.id, otherUserId],
                lastMessageTimestamp: new Date().toISOString(),
            };
            CHATS.push(newChat);
            
            const newChatMessage: ChatMessage = {
                id: CHAT_MESSAGES.length + 1,
                chatId: newChat.id,
                senderId: currentUser.id,
                text: "Hi! Let's chat about our skill swap.",
                timestamp: new Date().toISOString(),
            };
            CHAT_MESSAGES.push(newChatMessage);

            navigate(`/chat/${newChat.id}`);
        }
    };

    const getStatusClass = (status: SwapStatus) => {
        switch (status) {
            case SwapStatus.Pending: return 'text-yellow-400';
            case SwapStatus.Accepted: return 'text-green-400';
            case SwapStatus.Rejected: return 'text-red-400';
            default: return 'text-gray-400';
        }
    };
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-white mb-6">Swap Requests</h1>
            <div className="space-y-6">
                {userRequests.map(req => {
                    const otherUser = USERS.find(u => u.id === (req.fromUserId === currentUser.id ? req.toUserId : req.fromUserId));
                    if (!otherUser) return null;
                    const isIncoming = req.toUserId === currentUser.id;

                    return (
                        <div key={req.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-grow">
                                <img src={otherUser.profilePhoto} alt={otherUser.name} className="w-16 h-16 rounded-full border-2 border-gray-600" />
                                <div>
                                    <p className="font-bold text-lg text-white">{otherUser.name}</p>
                                    <p className="text-sm text-gray-400">{isIncoming ? "Wants to swap with you" : "You sent a request"}</p>
                                </div>
                            </div>
                            <div className="flex-grow text-center">
                                <p className="text-gray-300"><span className="font-semibold text-teal-400">{isIncoming ? otherUser.name : "You"} offered:</span> {req.offeredSkill}</p>
                                <p className="text-gray-300"><span className="font-semibold text-teal-400">{isIncoming ? "You" : otherUser.name} wanted:</span> {req.wantedSkill}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-48 text-center">
                               <p className={`font-bold text-lg ${getStatusClass(req.status)}`}>Status: {req.status}</p>
                                {isIncoming && req.status === SwapStatus.Pending && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleStatusChange(req.id, SwapStatus.Accepted)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm">Accept</button>
                                        <button onClick={() => handleStatusChange(req.id, SwapStatus.Rejected)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm">Reject</button>
                                    </div>
                                )}
                                {req.status === SwapStatus.Accepted && (
                                     <button onClick={() => handleGoToChat(otherUser.id)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm mt-2">Go to Chat</button>
                                )}
                            </div>
                        </div>
                    );
                })}
                 {userRequests.length === 0 && <p className="text-center text-gray-400 py-10">You have no swap requests.</p>}
            </div>
        </div>
    );
};

const MessagesPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    const userChats = useMemo(() => 
        CHATS.filter(chat => chat.participantIds.includes(currentUser.id))
             .sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()),
    [currentUser.id]);
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <ul className="divide-y divide-gray-700">
                    {userChats.length > 0 ? userChats.map(chat => {
                        const otherParticipantId = chat.participantIds.find(id => id !== currentUser.id);
                        const otherUser = USERS.find(u => u.id === otherParticipantId);
                        
                        const lastMessage = [...CHAT_MESSAGES]
                            .filter(m => m.chatId === chat.id)
                            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                        if (!otherUser) return null;

                        return (
                            <li key={chat.id} className="p-4 hover:bg-gray-700/50 transition cursor-pointer" onClick={() => navigate(`/chat/${chat.id}`)}>
                                <div className="flex items-center space-x-4">
                                    <img src={otherUser.profilePhoto} alt={otherUser.name} className="w-12 h-12 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-bold text-white">{otherUser.name}</p>
                                        <p className="text-gray-400 truncate">{lastMessage ? lastMessage.text : 'No messages yet'}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 flex-shrink-0">{new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </li>
                        )
                    }) : (
                        <p className="text-center text-gray-400 p-10">You have no messages.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

const ChatPage = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const { currentUser } = useAuth();
    const chat = useMemo(() => CHATS.find(c => c.id === parseInt(chatId || '')), [chatId]);
    const [messages, setMessages] = useState(() => CHAT_MESSAGES.filter(m => m.chatId === chat?.id));
    const [newMessage, setNewMessage] = useState('');
    const navigate = useNavigate();

    if (!currentUser || !chat || !chat.participantIds.includes(currentUser.id)) {
        return <div className="container mx-auto text-center py-10">Chat not found or access denied.</div>;
    }
    
    const otherParticipantId = chat.participantIds.find(id => id !== currentUser.id);
    const otherUser = USERS.find(u => u.id === otherParticipantId);

    if (!otherUser) {
        return <div className="container mx-auto text-center py-10">User not found.</div>;
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const message: ChatMessage = {
            id: Date.now(),
            chatId: chat.id,
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };
        
        CHAT_MESSAGES.push(message);
        chat.lastMessageTimestamp = message.timestamp;
        setMessages([...messages, message]);
        setNewMessage('');
    };

    return (
        <div className="container mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="border-b border-gray-700 p-4 flex items-center space-x-4 flex-shrink-0">
                 <button onClick={() => navigate('/messages')} className="p-2 rounded-full hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 </button>
                 <img src={otherUser.profilePhoto} alt={otherUser.name} className="w-10 h-10 rounded-full" />
                 <h1 className="text-xl font-bold text-white">Chat with {otherUser.name}</h1>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map(msg => (
                     <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== currentUser.id && <img src={otherUser.profilePhoto} className="w-8 h-8 rounded-full" alt="avatar"/>}
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.senderId === currentUser.id ? 'bg-teal-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                            <p className="text-white">{msg.text}</p>
                             <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-700 p-4 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoFocus
                    />
                    <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition">Send</button>
                </form>
            </div>
        </div>
    );
};

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

// ========= MAIN APP =========
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="user/:userId" element={<UserDetailPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="chat/:chatId" element={<ChatPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
