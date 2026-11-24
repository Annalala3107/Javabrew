---
title: "Chuyên đề SQL: Nền tảng cú pháp, Truy vấn, Tổng hợp, Nối bảng, Truy vấn con và Câu hỏi phỏng vấn thường gặp"
description: "Lộ trình học tập nền tảng cơ sở dữ liệu và phỏng vấn SQL, bao gồm truy vấn SQL, lọc, sắp xếp, tổng hợp, gom nhóm, nối bảng, truy vấn con, thêm/sửa/xóa, ràng buộc, Transaction và các câu hỏi phỏng vấn SQL thường gặp."
category: Cơ sở dữ liệu
tag:
  - SQL
  - Cơ sở dữ liệu
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: SQL,Câu hỏi phỏng vấn SQL,Cú pháp SQL,Truy vấn SQL,Tổng hợp SQL,Nối bảng SQL,Truy vấn con SQL,Nền tảng cơ sở dữ liệu,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/database/sql/README.md
---

SQL là kỹ năng nền tảng về cơ sở dữ liệu không thể thiếu trong phát triển Backend. Dù sau này bạn học MySQL Index, Execution Plan hay tối ưu Slow SQL, trước hết đều phải nắm chắc các ngữ nghĩa cơ bản như truy vấn, lọc, tổng hợp (aggregation), nối bảng (join), truy vấn con (subquery) và chỉnh sửa dữ liệu.

## Phù hợp với ai

- Lập trình viên Backend đang học nền tảng cơ sở dữ liệu và cú pháp SQL.
- Các bạn đang chuẩn bị phỏng vấn liên quan đến SQL cơ bản, bài tập truy vấn SQL và thao tác CRUD trên cơ sở dữ liệu.
- Độc giả đã từng viết SQL đơn giản, nhưng chưa thực sự thành thạo về `JOIN`, `GROUP BY`, `HAVING`, truy vấn con (subquery) và thứ tự thực thi.
- Kỹ sư muốn củng cố nền tảng SQL cơ bản trước khi học MySQL Index và tối ưu SQL.

## Trọng tâm học tập

- Cần hiểu vai trò và thứ tự thực thi của `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `GROUP BY`, `HAVING` như thế nào?
- `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `UNION` và truy vấn con (subquery) lần lượt phù hợp với những kịch bản nào?
- Làm sao kết hợp sử dụng hàm tổng hợp (Aggregate Function), thống kê gom nhóm và lọc điều kiện?
- Những trường hợp biên nào dễ bị bỏ sót khi viết `INSERT`, `UPDATE`, `DELETE`?
- Trong phỏng vấn, các bài toán SQL nên được phân rã theo quan hệ bảng, điều kiện lọc, chiều tổng hợp và sắp xếp/phân trang như thế nào?

## Thứ tự đọc khuyến nghị

1. [Tổng hợp kiến thức nền tảng về cú pháp SQL](./sql-syntax-summary.md): Nắm vững có hệ thống cú pháp cơ bản và các thao tác phổ biến của SQL trước.
2. [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 1)](./sql-questions-01.md), [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 2)](./sql-questions-02.md): Luyện tập truy vấn cơ bản, sắp xếp, tổng hợp và các hàm phổ biến.
3. [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 3)](./sql-questions-03.md): Tiếp tục bổ sung kiến thức về nối bảng, truy vấn con và tư duy giải truy vấn phức tạp.
4. [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 4)](./sql-questions-04.md), [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 5)](./sql-questions-05.md): Củng cố khả năng phân rã bài toán truy vấn thông qua nhiều dạng bài tập hơn.
5. Sau khi học xong nền tảng SQL, bạn nên tiếp tục đọc [Chuyên đề MySQL](../mysql/) để kết hợp cách viết SQL với Index và Execution Plan.

## Các bài viết cốt lõi

- [Tổng hợp kiến thức nền tảng về cú pháp SQL](./sql-syntax-summary.md): Bao phủ các cú pháp cơ bản như truy vấn, lọc, sắp xếp, tổng hợp, gom nhóm, nối bảng, truy vấn con, chèn, cập nhật, xóa và ràng buộc.
- [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 1)](./sql-questions-01.md): Làm quen với truy vấn, sắp xếp và lọc đơn giản thông qua các bài tập nền tảng.
- [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 2)](./sql-questions-02.md): Tiếp tục luyện tập hàm, xử lý chuỗi, xử lý ngày tháng và các cách viết truy vấn phổ biến.
- [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 3)](./sql-questions-03.md): Phù hợp để rèn luyện truy vấn nhiều bảng, thống kê gom nhóm và phân rã truy vấn con.
- [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 4)](./sql-questions-04.md): Bổ sung thêm các bài tập phỏng vấn SQL thường gặp và hướng giải quyết.
- [Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 5)](./sql-questions-05.md): Củng cố thêm khả năng vận dụng tổng hợp cho các bài toán truy vấn SQL.

## Câu hỏi tần suất cao

- Thứ tự thực thi logic của một câu truy vấn SQL là gì?
- `WHERE` và `HAVING` khác nhau như thế nào?
- `INNER JOIN` và `LEFT JOIN` khác nhau như thế nào?
- `UNION` và `UNION ALL` khác nhau như thế nào?
- `COUNT(\*)`, `COUNT(1)`, `COUNT(tên_cột)` khác nhau như thế nào?
- Nên lựa chọn giữa truy vấn con (subquery) và `JOIN` như thế nào?
- Tại sao sau `GROUP BY` chỉ có thể chọn cột gom nhóm hoặc kết quả tổng hợp?
- Có những cách viết truy vấn phân trang phổ biến nào?
- Tại sao `UPDATE` và `DELETE` nhất định phải cẩn thận kèm theo điều kiện lọc?
- Làm thế nào để phân rã bài toán SQL dựa trên quan hệ giữa các bảng?

## Chuyên đề liên quan

- [Hệ thống kiến thức Cơ sở dữ liệu](../)
- [Chuyên đề MySQL](../mysql/)
- [Hệ thống kiến thức Hệ thống hiệu năng cao (High Performance)](../../high-performance/)
- [Tổng hợp các kỹ thuật tối ưu SQL phổ biến](../../high-performance/sql-optimization.md)
