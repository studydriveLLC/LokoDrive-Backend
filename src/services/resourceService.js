const Resource = require('../models/Resource');
const AppError = require('../utils/AppError');

exports.getAllResources = async (query) => {
  const { search, category, level, sort, page = 1, limit = 10 } = query;

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

  return { resources, total, page: Number(page), pages: Math.ceil(total / limit) };
};

exports.getResourceById = async (id) => {
  const resource = await Resource.findById(id).populate('uploadedBy', 'pseudo avatar');

  if (!resource) {
    throw new AppError('Ressource non trouvee.', 404);
  }

  if (resource.status !== 'ready') {
    throw new AppError('Cette ressource est en cours de traitement, elle sera disponible dans quelques instants.', 202);
  }

  resource.views += 1;
  await resource.save();

  return resource;
};

exports.trackDownload = async (id) => {
  const resource = await Resource.findByIdAndUpdate(
    id,
    { $inc: { downloads: 1 } },
    { new: true, runValidators: true }
  );

  if (!resource) {
    throw new AppError('Ressource non trouvee.', 404);
  }

  return resource;
};

exports.createResource = async (resourceData) => {
  const resource = await Resource.create(resourceData);
  return resource;
};