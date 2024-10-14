import { Database } from "../src/database";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `
            SELECT COUNT(DISTINCT a.id) AS count
            FROM apps a
            JOIN apps_pricing_plans app_plan ON a.id = app_plan.app_id
            JOIN pricing_plans p ON app_plan.pricing_plan_id = p.id
            WHERE p.price = '0' OR p.price LIKE '%free%';
        `;
        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `
            SELECT COUNT(ac.app_id) AS count, c.title AS category
            FROM categories c
            JOIN apps_categories ac ON c.id = ac.category_id
            GROUP BY c.id, c.title
            ORDER BY count DESC
                LIMIT 3;
        `;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `
            SELECT
                COUNT(app_plan.app_id) AS count, 
                p.price, 
            CAST(SUBSTR(p.price, 2, LENGTH(p.price) - 7) AS REAL) AS casted_price
            FROM pricing_plans p
            JOIN apps_pricing_plans app_plan ON p.id = app_plan.pricing_plan_id
            WHERE CAST(SUBSTR(p.price, 2, LENGTH(p.price) - 7) AS REAL) BETWEEN 5 AND 10
            GROUP BY p.price
            ORDER BY count DESC
            LIMIT 3;
        `;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 223, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 113, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});