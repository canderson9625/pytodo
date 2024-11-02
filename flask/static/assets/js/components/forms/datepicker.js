"use strict"

export default class datepickerInteractivity {
    input;

    constructor(input) {
        const now = new Date(Date.now());
        this.now = now;
        this.year = now.getFullYear();
        this.month = now.getMonth();
        this.date = now.getDate();
        this.hour = now.getHours();
        this.day = now.getDay();
        this.leapyear = this.#leapyear();

        this.time = new Date(now.toISOString());
        this.input = {
            input,
            combobox: input.parentElement,
            listbox: input.parentElement.querySelector('[role="listbox"]'),
            datepicker: input.parentElement.querySelector('input[type*="date"]'),
            nested: input.parentElement.querySelector('li:has(:is(ol, ul)) :is(ol, ul)')
        };
        this.input.combobox.addEventListener("click", () => {
            const parentClass = this.input.combobox.parentElement.classList;
            if (parentClass.contains('unsealed') === false) {
                parentClass.add("unsealed");
                this.input.listbox.inert = false;
            }
        })

        // buttons
        this.input.listbox.querySelector('.reset, #reset')?.addEventListener('click', () => {
            this.resetInput();
        })
        this.input.listbox.querySelector('.today, #today')?.addEventListener('click', () => {
            this.resetTime();
            this.today();
        })
        this.input.listbox.querySelector('.tomorrow, #tomorrow').addEventListener('click', () => {
            this.resetTime();
            this.tomorrow();
        })
        this.input.listbox.querySelector('.next-week, #next-week').addEventListener('click', () => {
            this.resetTime();
            this.next.week();
        })
        this.input.listbox.querySelector('.next-month, #next-month').addEventListener('click', () => {
            this.resetTime();
            this.next.month();
        })
        this.input.listbox.querySelector('.next-year, #next-year').addEventListener('click', () => {
            this.resetTime();
            this.next.year();
        })
        const weekday = (evt) => {
            evt.preventDefault();
            this.resetTime();
            this.weekday(); // attach handlers to days
            const expandWeekday = () => {
                this.input.nested.parentElement.querySelector('button').innerText = 'Back'
                this.input.nested.inert = false
                this.nested = true
            }

            setTimeout(() => {
                // document.activeElement on focusOut is body
                // setTimeout gives us the actual activeElement
                if (this.nested !== false) {
                    if (evt.type === "focusout") {
                        if (this.input.combobox.contains(document.activeElement) === false && this.input.nested.parentElement.contains(document.activeElement) === false) {
                            this.resetNested()
                        }
                        return 
                    } 
                }

                if (evt.type === "click") {
                    if (this.input.nested.parentElement.contains(document.activeElement)) {
                        console.log(this.nested)
                        return Boolean(this.nested)
                            ? this.resetNested()
                            : expandWeekday()
                    }
                } else if (evt.type !== "mouseout" && evt.type !== "focusout") {
                    const timeoutId = setTimeout(() => {
                        if (this.input.combobox.contains(document.activeElement) && this.input.nested.parentElement.contains(document.activeElement)) {
                            this.nested = timeoutId
                            expandWeekday()
                        }
                    }, 1000);
                }
            }, 50);
        };
        this.input.listbox.querySelector('.weekday').addEventListener("focus", weekday)
        this.input.listbox.querySelector('.weekday').addEventListener("focusout", weekday)
        this.input.listbox.querySelector('.weekday').addEventListener("click", weekday)
        this.input.listbox.querySelector('.weekday').addEventListener("mouseenter", weekday)
        this.input.listbox.querySelector('.weekday').addEventListener("mouseout", weekday)

        this.input.datepicker.addEventListener('focus', () => {
            this.input.datepicker.showPicker();
        })
        this.input.datepicker.addEventListener('input', () => {
            this.input.input.value = new Date(this.input.datepicker.value).toLocaleString('en-US', { second: undefined });
        })
    }

    #leapyear() {
        [
            (this.year / 4) % 1 == 0, // year is divisble by 4
            (this.year / 100) % 1 != 0, // year is not divisible by 100
            (this.year / 400) % 1 == 0 // except when year is divisible by 400
            // (this.year / 400) % 1 == 0 // i would assume is not divisible by 1000
            // (this.year / 400) % 1 == 0 // except when year is divisible by 4000
        ].reduce((a, b) => a && b, true);
    }

    #time(start) {
        if (start !== "end" || start === "start") {
            this.time.setHours(0);
            this.time.setMinutes(0);
            this.time.setSeconds(0);
            this.time.setMilliseconds(0);
        } else {
            this.time.setHours(23);
            this.time.setMinutes(59);
            this.time.setSeconds(59);
            this.time.setMilliseconds(999);
        }
    }

    #timezone() {
        const offset = this.time.getTimezoneOffset() / 60;
        this.time.setHours(this.time.getHours() - offset);

        const isoString = this.time.toISOString();
        // slice off the .seconds.millisecondsZ
        this.input.datepicker.value = isoString.slice(0, -8);
    }

    #render() {
        this.#timezone();

        if (this.input.combobox.parentElement.classList.contains("unsealed") === false) {
            this.input.combobox.parentElement.classList.add("unsealed");
            this.input.listbox.inert = false;
        }

        this.input.nested.parentElement.querySelector('button').innerText = 'Weekday';
    }

    resetTime() {
        this.time = new Date(this.now.toISOString());
    }

    resetInput() {
        this.input.input.value = "";
        this.input.datepicker.value = "";
    }

    today(start="end") {
        this.input.input.value = "Today";
        this.#time(start)
        this.#render();
    }

    tomorrow(start="end") {
        this.input.input.value = "Tomorrow";
        this.#time(start)
        this.time.setDate(this.date + 1)
        this.#render();
    }

    nested = false;
    resetNested = () => {
        this.input.input.focus();
        clearInterval(this.nested);
        this.nested = false;
        this.input.nested.parentElement.querySelector('button').innerText = 'Weekday';
        return this.input.nested.inert = true;
    }
    nestedChildren = [];
    weekday() {
        this.input.nested.querySelectorAll('li').forEach((child, idx) => {
            const day = child.children[0].innerText;

            if (this.nestedChildren.findIndex(nc => nc.day === day) === -1) {
                this.nestedChildren.push({
                    child,
                    day
                });

                child.addEventListener("click", () => {
                    this.input.input.value = day;

                    const sameDay = idx === this.day;
                    if (sameDay) {
                        this.next.week();
                    } else {
                        this.next.week(idx)
                    }

                    this.resetNested();
                })
            }
        })
    }

    next = {
        week: (newDay=7) => {
            if (newDay === 7) {
                this.input.input.value = "Next Week";
            }
            const normal = this.date / 7;
            const dayMonthRollover = (x, daysInMonth) => {
                console.log(x, daysInMonth)
                const newDay = this.date + x
                return newDay - (daysInMonth - 1) > 0
                    ? newDay - daysInMonth
                    : newDay
            }
            if (normal >= 4) {
                if (this.month === 2) {
                    if (this.leapyear === false) {
                        this.setDate(dayMonthRollover(newDay, 28));
                    } else {
                        this.setDate(dayMonthRollover(newDay, 29));
                    }
                    this.setMonth(this.month + 1);
                    return this.#render();
                }

                const monthsWith30Days = [4, 6, 9, 11];
                if (monthsWith30Days.includes(this.month)) {
                    this.setDate(dayMonthRollover(newDay, 30));
                } else {
                    this.setDate(dayMonthRollover(newDay, 31));
                }
                this.setMonth(this.month + 1);
            }

            this.time.setDate(this.date + newDay);
            // console.log(this.time);
            this.#render();
        },
        month: () => {
            this.input.input.value = "Next Month";
            this.month + 1 > 12 
                ? this.time.setMonth(1)
                : this.time.setMonth(this.month + 1)
            this.#render();
        },
        year: () => {
            this.input.input.value = "Next Year";
            this.time.setFullYear(this.year + 1)
            this.#render();
        }
    }
}