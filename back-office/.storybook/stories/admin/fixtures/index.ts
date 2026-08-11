import type {
  AuthResult,
  MenuItem,
  Order,
  Settings,
  User,
  UserRole,
} from "../../../../src/shared/ui/admin/Admin.types";

interface RegisteredPhone {
  name: string;
  role: UserRole | null;
  blocked?: boolean;
}

export interface AuthFixtures {
  login: (phone: string) => AuthResult;
}

export interface AdminFixtures {
  auth: AuthFixtures;
  orders: Order[];
  menuItems: MenuItem[];
  users: User[];
  settings: Settings;
}

export function createAuthFixtures(): AuthFixtures {
  const registeredPhones: Record<string, RegisteredPhone> = {
    "+7 900 123-45-67": { name: "Анна Смирнова", role: "administrator" },
    "+7 911 234-56-78": { name: "Дмитрий Иванов", role: "barista" },
    "+7 922 345-67-89": { name: "Елена Петрова", role: "barista" },
    "+7 933 456-78-90": { name: "Роман Федоров", role: null },
    "+7 944 567-89-01": {
      name: "Виктория Белова",
      role: "barista",
      blocked: true,
    },
  };

  return {
    login(phone) {
      const record = registeredPhones[phone];

      if (!record) return "not_found";
      if (!record.role || record.blocked) return "no_role";

      return "ok";
    },
  };
}

export function createOrderFixtures(): Order[] {
  return [
    {
      id: "1",
      orderNumber: "#1234",
      customerName: "Анна Смирнова",
      items: "Капучино M, Круассан",
      total: 380,
      status: "Created",
      slotTime: "10:00",
      createdAt: new Date(),
    },
    {
      id: "2",
      orderNumber: "#1235",
      customerName: "Дмитрий Иванов",
      items: "Латте L, Чизкейк",
      total: 450,
      status: "Confirmed",
      slotTime: "10:10",
      createdAt: new Date(),
    },
    {
      id: "3",
      orderNumber: "#1236",
      customerName: "Елена Петрова",
      items: "Эспрессо, Круассан",
      total: 280,
      status: "Ready for pickup",
      slotTime: "10:20",
      createdAt: new Date(),
    },
  ];
}

export function createMenuFixtures(): MenuItem[] {
  return [
    {
      id: "1",
      name: "Капучино",
      category: "Кофе",
      available: true,
      sizes: [
        { size: "S", price: 180 },
        { size: "M", price: 220 },
        { size: "L", price: 260 },
      ],
    },
    {
      id: "2",
      name: "Латте",
      category: "Кофе",
      available: true,
      sizes: [
        { size: "S", price: 200 },
        { size: "M", price: 240 },
        { size: "L", price: 280 },
      ],
    },
    {
      id: "3",
      name: "Эспрессо",
      category: "Кофе",
      available: true,
      price: 150,
    },
    {
      id: "4",
      name: "Круассан",
      category: "Выпечка",
      available: true,
      price: 160,
    },
    {
      id: "5",
      name: "Чизкейк",
      category: "Десерты",
      available: false,
      price: 280,
    },
    {
      id: "6",
      name: "Молоко",
      category: "Тип молока",
      available: true,
      price: 0,
      isOptionGroup: true,
    },
    {
      id: "7",
      name: "Соевое молоко",
      category: "Тип молока",
      available: true,
      price: 30,
      isOptionGroup: true,
    },
    {
      id: "8",
      name: "Миндальное молоко",
      category: "Тип молока",
      available: true,
      price: 40,
      isOptionGroup: true,
    },
    {
      id: "9",
      name: "Сахар",
      category: "Добавки",
      available: true,
      price: 0,
      isOptionGroup: true,
    },
    {
      id: "10",
      name: "Сироп ваниль",
      category: "Добавки",
      available: true,
      price: 50,
      isOptionGroup: true,
    },
    {
      id: "11",
      name: "Сироп карамель",
      category: "Добавки",
      available: true,
      price: 50,
      isOptionGroup: true,
    },
  ];
}

export function createUserFixtures(): User[] {
  return [
    {
      id: "1",
      name: "Анна Смирнова",
      role: "administrator",
      status: "active",
      phone: "+7 900 123-45-67",
    },
    {
      id: "2",
      name: "Дмитрий Иванов",
      role: "barista",
      status: "active",
      phone: "+7 911 234-56-78",
    },
    {
      id: "3",
      name: "Елена Петрова",
      role: "barista",
      status: "active",
      phone: "+7 922 345-67-89",
    },
    {
      id: "4",
      name: "Роман Федоров",
      role: null,
      status: "active",
      phone: "+7 933 456-78-90",
    },
    {
      id: "5",
      name: "Виктория Белова",
      role: "barista",
      status: "blocked",
      phone: "+7 944 567-89-01",
    },
  ];
}

export function createSettingsFixture(): Settings {
  return {
    workingHoursOpen: "09:00",
    workingHoursClose: "20:00",
    slotCapacity: 5,
  };
}

export function createAdminFixtures(): AdminFixtures {
  return {
    auth: createAuthFixtures(),
    orders: createOrderFixtures(),
    menuItems: createMenuFixtures(),
    users: createUserFixtures(),
    settings: createSettingsFixture(),
  };
}
