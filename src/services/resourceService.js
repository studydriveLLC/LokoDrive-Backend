const Resource = require('../models/Resource');
const AppError = require('../utils/AppError');
const redisClient = require('../config/redis'); // Import de notre arme secrète

exports.getAllResources = async (query) => {
  const { search, category, level, sort, page = 1, limit = 10 } = query;

  // 1. Création d'une clé de cache unique basée sur la requête exacte
  const cacheKey = `resources:feed:${search || 'all'}:${category || 'all'}:${level || 'all'}:${sort || 'new'}:${page}:${limit}`;

  try {
    // 2. Interrogation de Redis (Vitesse de la lumière)
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData); // Retour instantané au frontend
    }
  } catch (err) {
    console.error('Erreur Redis GET ignorée, fallback sur MongoDB:', err);
  }

  // 3. Si non trouvé dans le cache, on fait le travail lourd sur MongoDB
  const filter = { status: 'ready' };

  if (search) {
    filter.$text = { $search: search };
  }
  if (category) filter.category = category;
  if (level) filter.level = level;

  const skip = (page - 1) * limit;

  let queryBuilder = Resource.find(filter)
    .populate('uploadedBy', 'pseudo avatar')
    .skip(skip)
    .limit(limit);

  if (sort === 'popular') {
    queryBuilder = queryBuilder.sort({ downloads: -1, views: -1 });
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  const [resources, total] = await Promise.all([
    queryBuilder,
    Resource.countDocuments(filter)
  ]);

  const result = { resources, total, page: Number(page), pages: Math.ceil(total / limit) };

  try {
    // 4. On sauvegarde dans Redis pour 60 secondes. 
    // Pendant 1 minute, tous les utilisateurs voulant cette page n'attendront pas MongoDB.
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60);
  } catch (err) {
    console.error('Erreur Redis SET ignorée:', err);
  }

  return result;
};

exports.getResourceById = async (id) => {
  const cacheKey = `resource:detail:${id}`;
  
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      // On incrémente la vue en arrière-plan sans bloquer l'utilisateur
      Resource.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
      return JSON.parse(cachedData);
    }
  } catch (err) {}

  const resource = await Resource.findById(id).populate('uploadedBy', 'pseudo avatar');

  if (!resource) {
    throw new AppError('Ressource non trouvée.', 404);
  }

  if (resource.status !== 'ready') {
    throw new AppError('Cette ressource est en cours de traitement, elle sera disponible dans quelques instants.', 202);
  }

  resource.views += 1;
  await resource.save();

  try {
    await redisClient.set(cacheKey, JSON.stringify(resource), 'EX', 120);
  } catch (err) {}

  return resource;
};

exports.trackDownload = async (id) => {
  const resource = await Resource.findByIdAndUpdate(
    id,
    { $inc: { downloads: 1 } },
    { new: true, runValidators: true }
  );

  if (!resource) {
    throw new AppError('Ressource non trouvée.', 404);
  }
  
  // Nettoyage du cache individuel pour mettre à jour les statistiques de téléchargement
  try {
     await redisClient.del(`resource:detail:${id}`);
  } catch (err) {}

  return resource;
};

exports.createResource = async (resourceData) => {
  const resource = await Resource.create(resourceData);
  
  // On détruit le cache global du feed pour que le nouveau document apparaisse immédiatement
  try {
    const keys = await redisClient.keys('resources:feed:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {}
  
  return resource;
};