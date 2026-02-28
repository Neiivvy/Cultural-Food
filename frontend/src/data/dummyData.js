// Dummy data for cultures
export const cultures = [
  {
    id: 1,
    name: 'Newari',
    description: 'Traditional Newari cuisine from the Kathmandu Valley, rich in flavor and cultural significance.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
    foodCount: 24
  },
  {
    id: 2,
    name: 'Brahmin/Chhetri',
    description: 'Authentic dishes from the Brahmin and Chhetri communities, representing Nepal\'s heritage.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    foodCount: 32
  },
  {
    id: 3,
    name: 'Madhesi',
    description: 'Vibrant and aromatic foods from the Madhesi community of the Terai region.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    foodCount: 18
  },
  {
    id: 4,
    name: 'Dalit',
    description: 'Traditional foods passed down through generations in Dalit communities.',
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
    foodCount: 15
  },
  {
    id: 5,
    name: 'Muslim',
    description: 'Halal foods and traditional Muslim cuisine with unique flavors and spices.',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
    foodCount: 20
  },
  {
    id: 6,
    name: 'Janajati',
    description: 'Indigenous foods from various Janajati ethnic groups across Nepal.',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
    foodCount: 28
  },
  {
    id: 7,
    name: 'Christian',
    description: 'Traditional and contemporary Christian community foods.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop',
    foodCount: 12
  }
];

// Dummy data for foods
export const foods = {
  'newari': [
    {
      id: 'newari-1',
      name: 'Chatamari',
      culture: 'Newari',
      description: 'Traditional Newari rice crepe, often called "Nepali Pizza", topped with eggs, meat, or vegetables.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      festival: 'Dashain',
      season: 'Winter',
      ingredients: ['Rice flour', 'Eggs', 'Meat', 'Onions'],
      preparation: 'Mix rice flour batter, spread on hot pan, add toppings and cook until crispy.'
    },
    {
      id: 'newari-2',
      name: 'Yomari',
      culture: 'Newari',
      description: 'Sweet dumpling made from rice flour filled with chaku (molasses) and sesame seeds.',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
      festival: 'Yomari Punhi',
      season: 'Winter',
      ingredients: ['Rice flour', 'Chaku', 'Sesame seeds'],
      preparation: 'Prepare rice dough, fill with chaku mixture, shape and steam.'
    },
    {
      id: 'newari-3',
      name: 'Bara',
      culture: 'Newari',
      description: 'Savory lentil pancake, crispy on the outside and soft inside, often served with achar.',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
      festival: 'Tihar',
      season: 'Autumn',
      ingredients: ['Black lentils', 'Ginger', 'Cumin'],
      preparation: 'Grind soaked lentils, season and fry on hot griddle.'
    }
  ],
  'brahmin-chhetri': [
    {
      id: 'brahmin-1',
      name: 'Dal Bhat',
      culture: 'Brahmin/Chhetri',
      description: 'Nepal\'s staple meal consisting of lentil soup, rice, vegetables, and pickles.',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
      festival: '',
      season: 'All',
      ingredients: ['Lentils', 'Rice', 'Vegetables', 'Spices'],
      preparation: 'Cook lentils with spices, serve with steamed rice and vegetables.'
    },
    {
      id: 'brahmin-2',
      name: 'Sel Roti',
      culture: 'Brahmin/Chhetri',
      description: 'Sweet, ring-shaped rice bread, deep-fried to crispy perfection.',
      image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=300&fit=crop',
      festival: 'Dashain',
      season: 'Autumn',
      ingredients: ['Rice flour', 'Sugar', 'Ghee', 'Cardamom'],
      preparation: 'Prepare fermented rice batter, fry in ring shapes until golden.'
    },
    {
      id: 'brahmin-3',
      name: 'Gundruk',
      culture: 'Brahmin/Chhetri',
      description: 'Fermented leafy green vegetable, a traditional side dish with unique sour flavor.',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
      festival: '',
      season: 'Winter',
      ingredients: ['Mustard greens', 'Salt'],
      preparation: 'Ferment greens, dry and cook with spices.'
    }
  ],
  'madhesi': [
    {
      id: 'madhesi-1',
      name: 'Thekua',
      culture: 'Madhesi',
      description: 'Crunchy sweet cookie made from wheat flour, jaggery and fennel seeds.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      festival: 'Chhath',
      season: 'Autumn',
      ingredients: ['Wheat flour', 'Jaggery', 'Fennel seeds', 'Ghee'],
      preparation: 'Mix ingredients, shape and deep fry until golden brown.'
    },
    {
      id: 'madhesi-2',
      name: 'Khichdi',
      culture: 'Madhesi',
      description: 'Comfort food made with rice and lentils, simple yet nourishing.',
      image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',
      festival: '',
      season: 'Winter',
      ingredients: ['Rice', 'Lentils', 'Turmeric', 'Ghee'],
      preparation: 'Cook rice and lentils together with spices and ghee.'
    }
  ],
  'dalit': [
    {
      id: 'dalit-1',
      name: 'Phapar ko Roti',
      culture: 'Dalit',
      description: 'Buckwheat flatbread, nutritious and traditionally eaten during fasting.',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
      festival: '',
      season: 'Winter',
      ingredients: ['Buckwheat flour', 'Water', 'Salt'],
      preparation: 'Knead dough and roll into flatbreads, cook on griddle.'
    }
  ],
  'muslim': [
    {
      id: 'muslim-1',
      name: 'Biryani',
      culture: 'Muslim',
      description: 'Fragrant rice dish with spiced meat, aromatic herbs and saffron.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
      festival: 'Eid',
      season: 'All',
      ingredients: ['Basmati rice', 'Meat', 'Spices', 'Saffron', 'Herbs'],
      preparation: 'Layer spiced meat and rice, cook together until aromatic.'
    },
    {
      id: 'muslim-2',
      name: 'Samosa',
      culture: 'Muslim',
      description: 'Crispy triangular pastry filled with spiced potatoes and peas.',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
      festival: '',
      season: 'All',
      ingredients: ['Flour', 'Potatoes', 'Peas', 'Spices'],
      preparation: 'Prepare filling, wrap in dough and deep fry until golden.'
    }
  ],
  'janajati': [
    {
      id: 'janajati-1',
      name: 'Dhindo',
      culture: 'Janajati',
      description: 'Traditional porridge made from millet or corn flour, eaten with vegetable curry.',
      image: 'https://images.unsplash.com/photo-1547558840-8ad19c4e2f6e?w=400&h=300&fit=crop',
      festival: '',
      season: 'All',
      ingredients: ['Millet flour', 'Water', 'Salt'],
      preparation: 'Cook flour in boiling water while stirring continuously.'
    },
    {
      id: 'janajati-2',
      name: 'Kinema',
      culture: 'Janajati',
      description: 'Fermented soybean dish, rich in protein and traditional to eastern Nepal.',
      image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400&h=300&fit=crop',
      festival: '',
      season: 'All',
      ingredients: ['Soybeans', 'Spices'],
      preparation: 'Ferment soybeans, cook with spices and herbs.'
    }
  ],
  'christian': [
    {
      id: 'christian-1',
      name: 'Christmas Cake',
      culture: 'Christian',
      description: 'Rich fruit cake prepared during Christmas celebrations.',
      image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=300&fit=crop',
      festival: 'Christmas',
      season: 'Winter',
      ingredients: ['Flour', 'Dried fruits', 'Nuts', 'Spices', 'Butter'],
      preparation: 'Mix ingredients, bake and soak in rum or juice.'
    }
  ]
};

// Get foods by culture
export const getFoodsByCulture = (cultureName) => {
  const key = cultureName.toLowerCase().replace(/\s+/g, '-');
  return foods[key] || [];
};

// Get food by ID
export const getFoodById = (foodId) => {
  for (let cultureFoods of Object.values(foods)) {
    const food = cultureFoods.find(f => f.id === foodId);
    if (food) return food;
  }
  return null;
};