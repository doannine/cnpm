const express = require('express');
const pool = require('./db');
const path = require('path');
const app = express();
const multer = require('multer'); // Import multer

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const bcrypt = require('bcryptjs');
const saltRounds = 10;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Route hiển thị trang chủ
app.get('/', (req, res) => {
    res.render('home'); // Render view 'home.ejs'
});

// Route POST xử lý đăng ký
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // Kiểm tra các trường có đầy đủ không
    if (!name || !email || !password) {
        return res.status(400).send('Please fill all fields');

    }

    // Kiểm tra mật khẩu
    const saltRounds = 5;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds); // Mã hóa mật khẩu

        // Lưu người dùng vào cơ sở dữ liệu
        const [rows] = await pool.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, 'user']);

        res.redirect(`/`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Route POST xử lý login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Kiểm tra các trường có đầy đủ không
    if (!email || !password) {
        return res.status(400).send('Please fill all fields');
    }

    try {
        // Tìm người dùng trong cơ sở dữ liệu theo email
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        // Kiểm tra xem người dùng có tồn tại không
        if (rows.length === 0) {
            return res.status(400).send('Invalid email or password');
        }

        const user = rows[0];

        // So sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa trong cơ sở dữ liệu
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid email or password');
        }

        // Kiểm tra nếu là admin, chuyển hướng tới admin_dashboard.html
        if (user.role === 'admin') {
            return res.redirect('/admin_dashboard');
        } else if (user.role === 'manager_apple') {
            return res.redirect('/manager_Apple');
        } else if (user.role === 'manager_android') {
            return res.redirect('/manager_Android');
        }

        // Nếu là user, chuyển hướng tới user_dashboard.html
        res.redirect('/user_dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});



// Route để hiển thị dashboard của manager_apple
app.get('/manager_Apple', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM phone WHERE brand = "Apple"');
        res.render('manager_Apple', { phones: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving Apple phones');
    }
});

// Route để hiển thị dashboard của manager_android
app.get('/manager_Android', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM phone WHERE brand = "Android"');
        res.render('manager_Android', { phones: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving Android phones');
    }
});



app.get('/admin_dashboard', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM phone');
        res.render('admin_dashboard', { phones: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving phone data');
    }
});

// Cấu hình multer để lưu ảnh trong thư mục 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file ngẫu nhiên
    }
});
const upload = multer({ storage: storage });

// Route để thêm sản phẩm mới
app.get('/add_phone', (req, res) => {
    res.render('add_phone');
});

// Route để thêm sản phẩm mới apple
app.get('/add_phone_apple', (req, res) => {
    res.render('add_phone_apple');
});

// Route để thêm sản phẩm mới android
app.get('/add_phone_android', (req, res) => {
    res.render('add_phone_android');
});








// Xử lý thêm sản phẩm mới
app.post('/add_phone', upload.single('image'), async (req, res) => {
    const { name, brand, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : '';

    try {
        const query = 'INSERT INTO phone (name, brand, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(query, [name, brand, price, stock, description, image]);
        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});




// Xử lý thêm sản phẩm mới  apple
app.post('/add_phone_apple', upload.single('image'), async (req, res) => {
    const { name, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : '';

    try {
        const query = 'INSERT INTO phone (name, brand, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(query, [name, "Apple", price, stock, description, image]);
        res.redirect('/manager_Apple');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});




// Xử lý thêm sản phẩm mới android
app.post('/add_phone_android', upload.single('image'), async (req, res) => {
    const { name, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : '';

    try {
        const query = 'INSERT INTO phone (name, brand, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?)';
        await pool.query(query, [name, "Android", price, stock, description, image]);
        res.redirect('/manager_android');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});




// Route để chỉnh sửa sản phẩm
app.get('/edit_phone/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [phone] = await pool.query('SELECT * FROM phone WHERE id = ?', [id]);
        res.render('edit_phone', { phone: phone[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});
// Route để chỉnh sửa sản phẩm apple
app.get('/edit_phone_apple/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [phone] = await pool.query('SELECT * FROM phone WHERE id = ?', [id]);
        res.render('edit_phone_apple', { phone: phone[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});
// Route để chỉnh sửa sản phẩm android
app.get('/edit_phone_android/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [phone] = await pool.query('SELECT * FROM phone WHERE id = ?', [id]);
        res.render('edit_phone_android', { phone: phone[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Xử lý chỉnh sửa sản phẩm
app.post('/edit_phone/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, brand, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : null; // Nếu không có ảnh, giữ lại ảnh cũ

    try {
        const query = `UPDATE phone SET name = ?, brand = ?, price = ?, stock = ?, description = ?${image ? ', image = ?' : ''} WHERE id = ?`;
        const values = image ? [name, brand, price, stock, description, image, id] : [name, brand, price, stock, description, id];
        await pool.query(query, values);
        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Xử lý chỉnh sửa sản phẩm apple
app.post('/edit_phone_apple/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : null; // Nếu không có ảnh, giữ lại ảnh cũ

    try {
        const query = `UPDATE phone SET name = ?, price = ?, stock = ?, description = ?${image ? ', image = ?' : ''} WHERE id = ?`;
        const values = image ? [name, price, stock, description, image, id] : [name, price, stock, description, id];
        await pool.query(query, values);
        res.redirect('/manager_Apple');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});
// Xử lý chỉnh sửa sản phẩm android
app.post('/edit_phone_android/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : null; // Nếu không có ảnh, giữ lại ảnh cũ

    try {
        const query = `UPDATE phone SET name = ?, price = ?, stock = ?, description = ?${image ? ', image = ?' : ''} WHERE id = ?`;
        const values = image ? [name, price, stock, description, image, id] : [name, price, stock, description, id];
        await pool.query(query, values);
        res.redirect('/manager_Android');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});
//Route để xóa sản phẩm
app.get('/delete_phone/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM phone WHERE id = ?', [id]);
        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Route để xóa sản phẩm apple
app.get('/delete_phone/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM phone WHERE id = ?', [id]);
        res.redirect('/manager_Apple');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});
// Route để xóa sản phẩm  android
app.get('/delete_phone/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM phone WHERE id = ?', [id]);
        res.redirect('/manager_Android');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


//Route to display the user dashboard
app.get('/user_dashboard', async (req, res) => {
    try {
        const [phones] = await pool.query('SELECT * FROM phone');
        res.render('user_dashboard', { phones });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

// Route to view product details
app.get('/view_detail/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [phone] = await pool.query('SELECT * FROM phone WHERE id = ?', [id]);
        res.render('view_detail', { phone: phone[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


// Khởi động server
const PORT = 3004;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});