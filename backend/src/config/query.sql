use movie;

select * from movie;

select * from show_time;

select * from booking;

select * from ticket;

select * from user;
select * from cinema_room;
select * from seat;
select * from actor;
select * from director;
select * from genre;
select * from movie_genre;

delete from show_time where ticket_id in (8,9,10,11,12,13,14,15);