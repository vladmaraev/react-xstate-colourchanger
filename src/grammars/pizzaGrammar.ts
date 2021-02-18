export const grammar = `
<grammar root="order">
   <rule id="order">
      I would like a
      <ruleref uri="#drink"/>
      <tag>out.drink = new Object(); out.drink.liquid=rules.drink.type;
           out.drink.drinksize=rules.drink.drinksize;</tag>
      and
      <ruleref uri="#pizza"/>
      <tag>out.pizza=rules.pizza;</tag>
   </rule>
   <rule id="kindofdrink">
      <one-of>
         <item>coke</item>
         <item>pepsi</item>
         <item>coca cola<tag>out="coke";</tag></item>
      </one-of>
   </rule>
   <rule id="foodsize">
      <tag>out="medium";</tag> <!-- "medium" is default if nothing said -->
      <item repeat="0-1">
         <one-of>
            <item>small<tag>out="small";</tag></item>
            <item>medium</item>
            <item>large<tag>out="large";</tag></item>
            <item>regular<tag>out="medium";</tag></item>
         </one-of>
      </item>
   </rule>
   <!-- Construct Array of toppings, return Array -->
   <rule id="tops">
      <tag>out=new Array;</tag>
      <ruleref uri="#top"/>
      <tag>out.push(rules.top);</tag>
      <item repeat="1-">
         and
         <ruleref uri="#top"/>
         <tag>out.push(rules.top);</tag>
      </item>
   </rule>
   <rule id="top">
      <one-of>
         <item>anchovies</item>
         <item>pepperoni</item>
         <item>mushroom<tag>out="mushrooms";</tag></item>
         <item>mushrooms</item>
      </one-of>
   </rule>
   <!-- Two properties (drinksize, type) on left hand side Rule Variable -->
   <rule id="drink">
      <ruleref uri="#foodsize"/>
      <ruleref uri="#kindofdrink"/>
      <tag>out.drinksize=rules.foodsize; out.type=rules.kindofdrink;</tag>
   </rule>
   <!-- Three properties on rules.pizza -->
   <rule id="pizza">
      <ruleref uri="#number"/>
      <ruleref uri="#foodsize"/>
      <tag>out.pizzasize=rules.foodsize; out.number=rules.number;</tag>
      pizzas with
      <ruleref uri="#tops"/>
      <tag>out.topping=rules.tops;</tag>
   </rule>
   <rule id="number">
      <one-of>
         <item>
            <tag>out=1;</tag>
            <one-of>
               <item>a</item>
               <item>one</item>
            </one-of>
         </item>
         <item>two<tag>out=2;</tag></item>
         <item>three<tag>out=3;</tag></item>
      </one-of>
   </rule>
</grammar>
`
