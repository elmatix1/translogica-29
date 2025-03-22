import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserRole } from "@/hooks/useAuth";
import MoroccanSuggestionInput from '@/components/shared/MoroccanSuggestionInput';

const userFormSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères" }),
  email: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
  role: z.enum(['admin', 'rh', 'planificateur', 'commercial', 'approvisionneur', 'exploitation', 'maintenance'] as const),
  cin: z.string()
    .regex(/^[A-Z]{1,2}[0-9]{6}$/, { 
      message: "Format CIN invalide. Format attendu: deux lettres suivies de 6 chiffres (ex: AB123456)"
    })
    .optional()
    .or(z.literal('')),
  city: z.string().optional(),
  address: z.string().min(5, { message: "L'adresse doit comporter au moins 5 caractères" }).optional()
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface AddUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUser: (user: UserFormValues) => void;
}

const roleLabels: Record<UserRole, string> = {
  'admin': 'Administrateur',
  'rh': 'Ressources Humaines',
  'planificateur': 'Planificateur',
  'commercial': 'Commercial',
  'approvisionneur': 'Approvisionneur',
  'exploitation': 'Chargé d\'exploitation',
  'maintenance': 'Chargé de maintenance'
};

const AddUserForm: React.FC<AddUserFormProps> = ({ open, onOpenChange, onAddUser }) => {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      role: "admin",
      cin: "",
      city: "",
      address: ""
    },
  });

  function onSubmit(values: UserFormValues) {
    onAddUser(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte utilisateur avec les informations et permissions appropriées.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="utilisateur123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <MoroccanSuggestionInput
                        id="name"
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        dataType="names"
                        placeholder="Ex: Mohamed Amine, Fatima Zahra"
                        required
                        className="mt-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="exemple@translogica.fr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carte Nationale d'Identité (CIN)</FormLabel>
                    <FormControl>
                      <MoroccanSuggestionInput
                        id="cin"
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        dataType="cin"
                        placeholder="Ex: AB123456"
                        className="mt-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <MoroccanSuggestionInput
                        id="city"
                        label=""
                        value={field.value}
                        onChange={field.onChange}
                        dataType="cities"
                        placeholder="Ex: Casablanca, Rabat"
                        className="mt-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="rh">Ressources Humaines</SelectItem>
                        <SelectItem value="planificateur">Planificateur</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="approvisionneur">Approvisionneur</SelectItem>
                        <SelectItem value="exploitation">Chargé d'exploitation</SelectItem>
                        <SelectItem value="maintenance">Chargé de maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <MoroccanSuggestionInput
                      id="address"
                      label=""
                      value={field.value}
                      onChange={field.onChange}
                      dataType="streets"
                      placeholder="Ex: Boulevard Mohammed V, Rue Hassan II"
                      className="mt-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter l'utilisateur</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserForm;
