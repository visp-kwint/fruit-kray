import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(input: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ь: '', ы: 'y', ъ: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return input
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('🌱 Сидирование базы данных...');

  await prisma.adModal.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@frukt-kray.ru',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@frukt-kray.ru',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const categoriesData = [
    'Фрукты',
    'Овощи',
    'Десерты',
    'Ягоды',
  ];

  const categories = {};
  for (const name of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
      },
    });
    categories[name] = cat;
  }

  const fruits = categories['Фрукты'];
  const vegetables = categories['Овощи'];
  const desserts = categories['Десерты'];
  const berries = categories['Ягоды'];

  const strawberry = await prisma.product.create({
    data: {
      name: 'Клубника садовая',
      description: 'Спелая клубника с грядки',
      details:
        'Сочная, ароматная и сладкая клубника. Подходит для десертов, завтраков, смузи и свежей подачи.',
      price: 350,
      categoryId: berries.id,
      isNew: true,
      isPopular: true,
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=900',
    },
  });

  const cherry = await prisma.product.create({
    data: {
      name: 'Вишня крупная',
      description: 'Сочная тёмно-красная вишня',
      details:
        'Отборная крупная вишня с насыщенным вкусом. Отлично подходит для пирогов, варенья, компотов и свежего употребления.',
      price: 280,
      categoryId: berries.id,
      isPopular: true,
      isDayItem: true,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=900',
    },
  });

  const apples = await prisma.product.create({
    data: {
      name: 'Яблоки Гала',
      description: 'Сладкие яблоки из сада',
      details:
        'Хрустящие яблоки сорта Гала. Подходят для перекуса, пирогов, запекания и свежих салатов.',
      price: 120,
      categoryId: fruits.id,
      stock: 200,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900',
    },
  });

  const peaches = await prisma.product.create({
    data: {
      name: 'Персики южные',
      description: 'Ароматные персики с юга',
      details:
        'Нежные южные персики с сочной мякотью. Яркий аромат, сладость и идеальная текстура.',
      price: 420,
      categoryId: fruits.id,
      isNew: true,
      isDiscount: true,
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?w=900',
    },
  });

  const tomatoes = await prisma.product.create({
    data: {
      name: 'Томаты черри',
      description: 'Мини-томаты из теплицы',
      details:
        'Ароматные мини-томаты для салатов, закусок, брускетт и гарниров. Очень сладкие и плотные.',
      price: 180,
      categoryId: vegetables.id,
      isNew: true,
      isDiscount: true,
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900',
    },
  });

  const cucumbers = await prisma.product.create({
    data: {
      name: 'Огурцы тепличные',
      description: 'Хрустящие огурчики без нитратов',
      details:
        'Свежие тепличные огурцы с тонкой кожицей и хрустящей мякотью. Отлично для салатов и подачи.',
      price: 90,
      categoryId: vegetables.id,
      isPopular: true,
      stock: 150,
      imageUrl: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=900',
    },
  });

  const eggplants = await prisma.product.create({
    data: {
      name: 'Баклажаны',
      description: 'Молодые баклажаны для запекания',
      details:
        'Молодые баклажаны с нежной структурой. Подходят для запекания, рагу, гриля и овощных блюд.',
      price: 140,
      categoryId: vegetables.id,
      stock: 70,
      imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=900',
    },
  });

  const zucchini = await prisma.product.create({
    data: {
      name: 'Кабачок молодой',
      description: 'Нежные кабачки с грядки',
      details:
        'Свежие молодые кабачки для оладий, запекания и рагу. Очень нежные и универсальные в готовке.',
      price: 80,
      categoryId: vegetables.id,
      isDiscount: true,
      stock: 90,
      imageUrl: 'https://images.unsplash.com/photo-1585598590027-b64fd97571e9?w=900',
    },
  });

  const cherryCake = await prisma.product.create({
    data: {
      name: 'Вишнёвый торт',
      description: 'Торт с прослойкой вишнёвого джема',
      details:
        'Праздничный торт с нежным кремом, бисквитом и вишнёвым джемом. Хороший выбор для семейного ужина и торжества.',
      price: 890,
      categoryId: desserts.id,
      isPopular: true,
      isDayItem: true,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900',
    },
  });

  const strawberryTart = await prisma.product.create({
    data: {
      name: 'Клубничный тарт',
      description: 'Песочное тесто с заварным кремом',
      details:
        'Нежный тарт с песочной основой, заварным кремом и свежей клубникой сверху. Идеален к чаю.',
      price: 480,
      categoryId: desserts.id,
      isNew: true,
      isPopular: true,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900',
    },
  });

  const pannaCotta = await prisma.product.create({
    data: {
      name: 'Панна-котта с ягодами',
      description: 'Итальянский десерт с ягодами',
      details:
        'Лёгкий сливочный десерт в итальянском стиле с ягодным соусом. Нежно, свежо и очень красиво.',
      price: 320,
      categoryId: desserts.id,
      isNew: true,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900',
    },
  });

  const strudel = await prisma.product.create({
    data: {
      name: 'Фруктовый штрудель',
      description: 'Слоёный штрудель с яблоками',
      details:
        'Слоёное тесто, яблоки, корица и мягкая текстура внутри. Классический десерт на каждый день.',
      price: 260,
      categoryId: desserts.id,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=900',
    },
  });

  await prisma.adModal.createMany({
    data: [
      {
        triggerCategoryId: fruits.id,
        title: 'К фруктам — десерт в подарок? 🍰',
        description: 'Отлично сочетается с вашей покупкой!',
        productId: cherryCake.id,
        isActive: true,
      },
      {
        triggerCategoryId: vegetables.id,
        title: 'Дополните ужин десертом! 🍒',
        description: 'Сладкое завершение овощного блюда.',
        productId: strawberryTart.id,
        isActive: true,
      },
      {
        triggerCategoryId: desserts.id,
        title: 'К десерту — свежие ягоды! 🍒',
        description: 'Вишня прекрасно дополнит ваш десерт.',
        productId: cherry.id,
        isActive: true,
      },
    ],
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      totalPrice: 1450,
      status: 'DONE',
      deliveryAddress: 'ул. Садовая, д. 12, кв. 34',
      deliveryLat: 55.7558,
      deliveryLng: 37.6173,
      deliveryMinutes: 27,
      items: {
        create: [
          {
            productId: cherry.id,
            name: cherry.name,
            price: cherry.price,
            quantity: 2,
          },
          {
            productId: cherryCake.id,
            name: cherryCake.name,
            price: cherryCake.price,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Админ:', admin.email);
  console.log('✅ Пользователь:', user.email);
  console.log('✅ Категорий:', 4);
  console.log('✅ Товаров:', 12);
  console.log('✅ Попапов:', 3);
  console.log('✅ Тестовый заказ создан');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });