Ứng dụng website minigame 20 ngày
Yêu cầu khách hàng:
Anh gửi thông tin yêu cầu: Giải pháp kỹ thuật để triển khai chương trình dạng mini game trong khoảng 20 ngày
- Mỗi ngày sẽ có 2-3 câu hỏi, người chơi sẽ trả lời và đưa ra dự đoán số người trả lời đúng. Ai trả lời đúng, dự đoán gần đúng và nhanh nhất sẽ nhận được giải thưởng ngày
- Ngoài giải thưởng ngày, khi kết thúc chương trình sẽ có tổng hợp xem trong 20 ngày ai là người trả lời đúng nhiều nhất sẽ có thêm giải thưởng chung cuộc


Thiết kế chức năng:
- Đăng nhập bằng google, facebook

Admin:
- Đăng nhập bằng email, mật khẩu
- Quản lý câu hỏi, câu trả lời
- Quản lý giải thưởng
- Quản lý người chơi
- Quản lý chương trình
- Quản lý kết quả

User:
- Đăng nhập bằng google, facebook
- Trả lời câu hỏi, dự đoán số người trả lời đúng
- Xem kết quả, giải thưởng, lịch sử trả lời
- Xem thông tin cá nhân
- Bảng xếp hạng ngày hôm trước
- Bảng xếp hạng chung cuộc


Cách tính điểm:
- Trả lời đúng mỗi câu hỏi được 100 điểm
- Tổng điểm hôm đó = tổng điểm trả lời đúng x (1 - |dự đoán - số người trả lời đúng|/max(dự đoán, số người trả lời đúng))

Xếp hạng theo điểm và thời gian trả lời

Backend:
Sử dụng: golang, redis, postgresql, Gin, pgx + georgysavva/scany
- Có khả năng xử lý tải cao (Scalability)


Frontend:
Sử dụng tailwind.
Thiết kế theo phong cách tối giản, hiện đại. Giao diện mobile first nhưng có thể hiển thị tốt trên desktop.
Màu Primary: #F97316



admin@minigame.com
admin123

