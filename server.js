const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const util = require('util');
const pump = util.promisify(require('stream').pipeline);
const multipart = require('@fastify/multipart');

// Đăng ký plugin multipart
fastify.register(multipart);

// Đăng ký plugin để phục vụ file tĩnh
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/', // Tất cả các file tĩnh sẽ được truy cập từ gốc
});

// Cấu hình CORS để React có thể giao tiếp với backend
fastify.register(require('@fastify/cors'), {
    origin: '*', // Hoặc giới hạn domain frontend nếu cần
});

// Endpoint xử lý upload file
fastify.post('/upload', async (req, reply) => {
    const data = await req.file(); // Lấy file từ request
    const uploadPath = path.join(__dirname, 'public/img');

    // Đảm bảo thư mục public/img tồn tại
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = `${Date.now()}-${data.filename}`; // Đặt tên file (timestamp + tên gốc)
    const filepath = path.join(uploadPath, filename);

    try {
        // Lưu file vào thư mục public/img
        await pump(data.file, fs.createWriteStream(filepath));
        reply.send({ filePath: `/img/${filename}` }); // Trả về đường dẫn file
    } catch (error) {
        console.error('Error saving file:', error);
        reply.code(500).send({ error: 'Failed to save file' });
    }
});

// Endpoint để lấy danh sách các file trong thư mục public/img
fastify.get('/images', async (req, reply) => {
    const uploadPath = path.join(__dirname, 'public/img');

    try {
        const files = fs.readdirSync(uploadPath); // Đọc danh sách file
        const imageUrls = files.map(file => `/img/${file}`); // Tạo đường dẫn truy cập ảnh
        reply.send(imageUrls); // Trả về danh sách đường dẫn
    } catch (error) {
        console.error('Error reading image directory:', error);
        reply.code(500).send({ error: 'Failed to retrieve images' });
    }
});

// Khởi động server
const start = async () => {
    try {
        await fastify.listen({ port: 5000 });
        console.log(`Server is running on http://localhost:5000`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
