
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/localStorage';

// Définition des rôles disponibles
export type UserRole = 
  | 'admin' 
  | 'rh'
  | 'planificateur'
  | 'commercial'
  | 'approvisionneur'
  | 'exploitation'
  | 'maintenance';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  cin?: string;
  city?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  hasActionPermission: (action: string) => boolean;
  allUsers: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_STORAGE_KEY = 'tms-users';
const AUTH_USER_KEY = 'tms-auth-user';
const AUTH_STATUS_KEY = 'tms-auth-status';
const USER_PASSWORDS_KEY = 'tms-user-passwords';

// Liste des utilisateurs par défaut
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrateur',
    email: 'admin@translogica.fr',
    role: 'admin' as UserRole,
    cin: 'AB123456',
    city: 'Casablanca',
    address: 'Boulevard Mohammed V'
  },
  {
    id: '2',
    username: 'rh',
    password: 'admin123',
    name: 'Responsable RH',
    email: 'rh@translogica.fr',
    role: 'rh' as UserRole,
    cin: 'K456789',
    city: 'Rabat',
    address: 'Rue Hassan II'
  },
  {
    id: '3',
    username: 'pl',
    password: 'admin123',
    name: 'Planificateur',
    email: 'planificateur@translogica.fr',
    role: 'planificateur' as UserRole,
    cin: 'X987654',
    city: 'Marrakech',
    address: 'Avenue des FAR'
  },
  {
    id: '4',
    username: 'cl',
    password: 'admin123',
    name: 'Commercial',
    email: 'commercial@translogica.fr',
    role: 'commercial' as UserRole,
    cin: 'J234567',
    city: 'Fès',
    address: 'Boulevard Zerktouni'
  },
  {
    id: '5',
    username: 'ap',
    password: 'admin123',
    name: 'Approvisionneur',
    email: 'approvisionneur@translogica.fr',
    role: 'approvisionneur' as UserRole,
    cin: 'BE789012',
    city: 'Tanger',
    address: 'Avenue Mohammed VI'
  },
  {
    id: '6',
    username: 'ch',
    password: 'admin123',
    name: 'Chargé d\'exploitation',
    email: 'exploitation@translogica.fr',
    role: 'exploitation' as UserRole,
    cin: 'C345678',
    city: 'Agadir',
    address: 'Boulevard Anfa'
  },
  {
    id: '7',
    username: 'chh',
    password: 'admin123',
    name: 'Chargé de maintenance',
    email: 'maintenance@translogica.fr',
    role: 'maintenance' as UserRole,
    cin: 'D901234',
    city: 'Meknès',
    address: 'Rue Ibn Batouta'
  }
];

// Cartographie des permissions d'accès par rôle
const ROLE_ACCESS_MAP: Record<UserRole, string[]> = {
  'admin': ['/', '/users', '/hr', '/vehicles', '/planning', '/orders', '/inventory', '/maintenance', '/reports', '/settings'],
  'rh': ['/', '/hr'],
  'planificateur': ['/', '/planning', '/vehicles'],
  'commercial': ['/', '/orders', '/reports'],
  'approvisionneur': ['/', '/inventory', '/orders'],
  'exploitation': ['/', '/vehicles', '/planning'],
  'maintenance': ['/', '/vehicles', '/maintenance']
};

// Cartographie des actions permises par rôle
const ACTION_PERMISSIONS: Record<string, UserRole[]> = {
  'add-user': ['admin'],
  'edit-user': ['admin'],
  'delete-user': ['admin'],
  'manage-roles': ['admin'],
  'add-vehicle': ['admin', 'exploitation'],
  'edit-vehicle': ['admin', 'exploitation', 'maintenance'],
  'add-order': ['admin', 'commercial'],
  'edit-order': ['admin', 'commercial'],
  'add-inventory': ['admin', 'approvisionneur'],
  'add-planning': ['admin', 'planificateur'],
  'edit-planning': ['admin', 'planificateur'],
  'manage-hr': ['admin', 'rh']
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = () => {
      const storedUser = loadFromLocalStorage<User | null>(AUTH_USER_KEY, null);
      const storedAuth = loadFromLocalStorage<boolean>(AUTH_STATUS_KEY, false);
      
      if (storedUser && storedAuth) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
      
      // Initialiser la liste des utilisateurs depuis localStorage
      let storedAllUsers = loadFromLocalStorage<User[]>(USERS_STORAGE_KEY, []);
      
      // Si aucun utilisateur n'est stocké, utiliser les utilisateurs par défaut
      if (storedAllUsers.length === 0) {
        storedAllUsers = DEFAULT_USERS.map(({ password, ...user }) => user);
        saveToLocalStorage(USERS_STORAGE_KEY, storedAllUsers);
      }
      
      // Initialiser les mots de passe des utilisateurs
      const defaultPasswords: Record<string, string> = {};
      DEFAULT_USERS.forEach(user => {
        defaultPasswords[user.username] = user.password;
      });
      
      // Charger les mots de passe stockés ou utiliser les mots de passe par défaut
      const storedPasswords = loadFromLocalStorage<Record<string, string>>(USER_PASSWORDS_KEY, defaultPasswords);
      setUserPasswords(storedPasswords);
      
      setAllUsers(storedAllUsers);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Persist users when they change
  useEffect(() => {
    if (allUsers.length > 0) {
      saveToLocalStorage(USERS_STORAGE_KEY, allUsers);
    }
  }, [allUsers]);

  // Persist passwords when they change
  useEffect(() => {
    if (Object.keys(userPasswords).length > 0) {
      saveToLocalStorage(USER_PASSWORDS_KEY, userPasswords);
    }
  }, [userPasswords]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérifier si l'utilisateur existe
    const foundUser = allUsers.find(u => u.username === username);
    
    // Vérifier le mot de passe
    const isPasswordCorrect = foundUser && userPasswords[username] === password;
    
    if (foundUser && isPasswordCorrect) {
      setUser(foundUser);
      setIsAuthenticated(true);
      saveToLocalStorage(AUTH_USER_KEY, foundUser);
      saveToLocalStorage(AUTH_STATUS_KEY, true);
      
      toast.success(`Bienvenue, ${foundUser.name}`, {
        description: `Vous êtes connecté en tant que ${foundUser.role}`,
      });
      
      setIsLoading(false);
      
      // Toujours rediriger vers le tableau de bord après une connexion réussie
      navigate('/dashboard', { replace: true });
      return true;
    } else {
      toast.error("Échec de la connexion", {
        description: "Nom d'utilisateur ou mot de passe incorrect",
      });
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_STATUS_KEY);
    toast.info("Déconnecté", {
      description: "Vous avez été déconnecté avec succès",
    });
    navigate('/login');
  };

  // Vérifier si l'utilisateur a les permissions requises
  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (requiredRoles.length === 0) return true; // Aucun rôle requis
    return requiredRoles.includes(user.role);
  };

  // Vérifier si l'utilisateur a la permission pour une action spécifique
  const hasActionPermission = (action: string): boolean => {
    if (!user) return false;
    
    if (!ACTION_PERMISSIONS[action]) return false;
    
    return ACTION_PERMISSIONS[action].includes(user.role);
  };

  // Fonctions de gestion des utilisateurs
  const addUser = (userData: Omit<User, 'id'>) => {
    if (!hasActionPermission('add-user')) {
      toast.error("Accès refusé", { description: "Vous n'avez pas les permissions pour ajouter un utilisateur" });
      return;
    }
    
    // Générer un nouvel ID
    const newId = (allUsers.length + 1).toString();
    
    const newUser = {
      id: newId,
      ...userData
    };
    
    // Ajouter l'utilisateur à la liste
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    
    // Enregistrer le mot de passe
    const newPasswords = { ...userPasswords, [userData.username]: userData.password || 'admin123' };
    setUserPasswords(newPasswords);
    
    // Enregistrer dans localStorage
    saveToLocalStorage(USERS_STORAGE_KEY, updatedUsers);
    saveToLocalStorage(USER_PASSWORDS_KEY, newPasswords);
    
    toast.success("Utilisateur ajouté", { description: `${newUser.name} a été ajouté avec succès` });
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    if (!hasActionPermission('edit-user')) {
      toast.error("Accès refusé", { description: "Vous n'avez pas les permissions pour modifier un utilisateur" });
      return;
    }
    
    const updatedUsers = allUsers.map(user => 
      user.id === id ? { ...user, ...userData } : user
    );
    
    setAllUsers(updatedUsers);
    
    // Enregistrer dans localStorage
    saveToLocalStorage(USERS_STORAGE_KEY, updatedUsers);
    
    toast.success("Utilisateur mis à jour", { description: "Les informations ont été mises à jour avec succès" });
  };

  const deleteUser = (id: string) => {
    if (!hasActionPermission('delete-user')) {
      toast.error("Accès refusé", { description: "Vous n'avez pas les permissions pour supprimer un utilisateur" });
      return;
    }
    
    const userToDelete = allUsers.find(user => user.id === id);
    if (userToDelete) {
      // Supprimer le mot de passe
      const { [userToDelete.username]: removedPassword, ...remainingPasswords } = userPasswords;
      setUserPasswords(remainingPasswords);
      
      // Supprimer l'utilisateur
      const updatedUsers = allUsers.filter(user => user.id !== id);
      setAllUsers(updatedUsers);
      
      // Enregistrer dans localStorage
      saveToLocalStorage(USERS_STORAGE_KEY, updatedUsers);
      saveToLocalStorage(USER_PASSWORDS_KEY, remainingPasswords);
      
      toast.success("Utilisateur supprimé", { description: "L'utilisateur a été supprimé avec succès" });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout,
      hasPermission,
      hasActionPermission,
      allUsers,
      addUser,
      updateUser,
      deleteUser
    }}>
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
